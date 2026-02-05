import { useRef, useCallback, useEffect } from 'react';
import type {
  WSMessage,
  JoinMessagePayload,
  DrawMessagePayload,
  ClearMessagePayload,
  SyncMessagePayload,
} from '@dolcanvas/shared';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { useDrawing } from './hooks/useDrawing';
import { useWebSocket } from './hooks/useWebSocket';
import './App.css';

const WS_URL = 'ws://localhost:8080';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Message handler ref (to avoid circular dependency)
  const messageHandlerRef = useRef<(message: WSMessage) => void>(() => {});

  // WebSocket connection
  const { sendMessage } = useWebSocket({
    url: WS_URL,
    onMessage: (message) => messageHandlerRef.current(message),
  });

  // Drawing logic with WebSocket integration
  const {
    color,
    width,
    userId,
    setColor,
    setWidth,
    handleClear,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleRemoteStroke,
    handleRemoteClear,
    handleSync,
  } = useDrawing({
    canvasRef,
    sendMessage,
  });

  // Route incoming WebSocket messages
  const handleMessage = useCallback(
    (message: WSMessage) => {
      switch (message.type) {
        case 'draw': {
          const payload = message.payload as DrawMessagePayload;
          handleRemoteStroke(payload.stroke);
          break;
        }
        case 'clear': {
          handleRemoteClear();
          break;
        }
        case 'sync': {
          const payload = message.payload as SyncMessagePayload;
          handleSync(payload.strokes);
          break;
        }
        default:
          console.warn(`Unknown message type: ${message.type}`);
      }
    },
    [handleRemoteStroke, handleRemoteClear, handleSync],
  );

  // Update message handler ref
  useEffect(() => {
    messageHandlerRef.current = handleMessage;
  }, [handleMessage]);

  // Send join message on mount
  useEffect(() => {
    const joinMessage: WSMessage<JoinMessagePayload> = {
      type: 'join',
      payload: { userId },
      timestamp: Date.now(),
    };
    sendMessage(joinMessage);
  }, [userId, sendMessage]);

  return (
    <div className="app">
      <Toolbar
        color={color}
        width={width}
        onColorChange={setColor}
        onWidthChange={setWidth}
        onClear={handleClear}
      />
      <Canvas
        canvasRef={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
}

export default App;
