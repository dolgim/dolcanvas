import { WebSocketServer, WebSocket } from 'ws';
import type {
  WSMessage,
  DrawStroke,
  DrawMessagePayload,
  ClearMessagePayload,
  JoinMessagePayload,
  SyncMessagePayload,
  UndoMessagePayload,
  RedoMessagePayload,
} from '@dolcanvas/shared';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;

const wss = new WebSocketServer({ port: PORT });

// Global stroke history
const strokes: DrawStroke[] = [];

console.log(`WebSocket server is running on ws://localhost:${PORT}`);

/**
 * Broadcast message to all clients except the sender
 */
function broadcast(message: string, excludeWs?: WebSocket): void {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client !== excludeWs) {
      client.send(message);
    }
  });
}

wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', (rawMessage) => {
    try {
      const message = JSON.parse(rawMessage.toString()) as WSMessage;
      console.log('Received:', message.type);

      switch (message.type) {
        case 'join': {
          const payload = message.payload as JoinMessagePayload;
          console.log(`User ${payload.userId} joined`);

          // Send current state to the new client
          const syncMessage: WSMessage<SyncMessagePayload> = {
            type: 'sync',
            payload: { strokes },
            timestamp: Date.now(),
          };
          ws.send(JSON.stringify(syncMessage));
          break;
        }

        case 'draw': {
          const payload = message.payload as DrawMessagePayload;
          console.log(`Draw stroke: ${payload.stroke.id}`);

          // Add to history
          strokes.push(payload.stroke);

          // Broadcast to other clients (exclude sender)
          broadcast(rawMessage.toString(), ws);
          break;
        }

        case 'clear': {
          const payload = message.payload as ClearMessagePayload;
          console.log(`User ${payload.userId} cleared canvas`);

          // Clear history
          strokes.length = 0;

          // Broadcast to other clients (exclude sender)
          broadcast(rawMessage.toString(), ws);
          break;
        }

        case 'undo': {
          const payload = message.payload as UndoMessagePayload;
          console.log(`User ${payload.userId} undo stroke: ${payload.strokeId}`);

          // Remove stroke from history
          const undoIndex = strokes.findIndex(
            (s) => s.id === payload.strokeId,
          );
          if (undoIndex !== -1) {
            strokes.splice(undoIndex, 1);
            broadcast(rawMessage.toString(), ws);
          }
          break;
        }

        case 'redo': {
          const payload = message.payload as RedoMessagePayload;
          console.log(`User ${payload.userId} redo stroke: ${payload.stroke.id}`);

          // Add stroke back to history
          strokes.push(payload.stroke);
          broadcast(rawMessage.toString(), ws);
          break;
        }

        default:
          console.warn(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});
