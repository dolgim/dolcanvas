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
  LeaveMessagePayload,
  UserInfo,
} from '@dolcanvas/shared';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8080;

const wss = new WebSocketServer({ port: PORT });

// Global stroke history
const strokes: DrawStroke[] = [];

// Connected user tracking
const users = new Map<WebSocket, UserInfo>();
let nextColorIndex = 0;

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
          const colorIndex = nextColorIndex % 8;
          nextColorIndex++;

          // Register user
          const userInfo: UserInfo = { userId: payload.userId, colorIndex };
          users.set(ws, userInfo);

          console.log(`User ${payload.userId} joined (color: ${colorIndex})`);

          // Send current state + existing users to the new client
          const otherUsers: UserInfo[] = [];
          users.forEach((info, client) => {
            if (client !== ws) {
              otherUsers.push(info);
            }
          });

          const syncMessage: WSMessage<SyncMessagePayload> = {
            type: 'sync',
            payload: { strokes, users: otherUsers },
            timestamp: Date.now(),
          };
          ws.send(JSON.stringify(syncMessage));

          // Broadcast join to other clients (with colorIndex)
          const joinBroadcast: WSMessage<JoinMessagePayload> = {
            type: 'join',
            payload: { userId: payload.userId, colorIndex },
            timestamp: Date.now(),
          };
          broadcast(JSON.stringify(joinBroadcast), ws);
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

        case 'cursor': {
          // Relay cursor position to other clients (no storage needed)
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
    const userInfo = users.get(ws);
    if (userInfo) {
      console.log(`User ${userInfo.userId} disconnected`);

      // Broadcast leave message
      const leaveMessage: WSMessage<LeaveMessagePayload> = {
        type: 'leave',
        payload: { userId: userInfo.userId },
        timestamp: Date.now(),
      };
      broadcast(JSON.stringify(leaveMessage));

      users.delete(ws);
    } else {
      console.log('Client disconnected');
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});
