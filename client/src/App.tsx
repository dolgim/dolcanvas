import { useRef, useCallback, useEffect } from 'react';
import type {
  WSMessage,
  JoinMessagePayload,
  DrawMessagePayload,
  SyncMessagePayload,
  UndoMessagePayload,
  RedoMessagePayload,
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
    tool,
    color,
    width,
    fontSize,
    textInput,
    userId,
    canUndo,
    canRedo,
    setTool,
    setColor,
    setWidth,
    setFontSize,
    commitText,
    cancelText,
    handleClear,
    handleUndo,
    handleRedo,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleRemoteStroke,
    handleRemoteClear,
    handleRemoteUndo,
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
        case 'undo': {
          const payload = message.payload as UndoMessagePayload;
          handleRemoteUndo(payload.strokeId);
          break;
        }
        case 'redo': {
          const payload = message.payload as RedoMessagePayload;
          handleRemoteStroke(payload.stroke);
          break;
        }
        default:
          console.warn(`Unknown message type: ${message.type}`);
      }
    },
    [handleRemoteStroke, handleRemoteClear, handleRemoteUndo, handleSync],
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

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (
        (mod && e.key === 'z' && e.shiftKey) ||
        (e.ctrlKey && e.key === 'y')
      ) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  return (
    <div className="app">
      <Toolbar
        tool={tool}
        color={color}
        width={width}
        fontSize={fontSize}
        canUndo={canUndo}
        canRedo={canRedo}
        onToolChange={setTool}
        onColorChange={setColor}
        onWidthChange={setWidth}
        onFontSizeChange={setFontSize}
        onClear={handleClear}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />
      <Canvas
        canvasRef={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        textInput={textInput}
        textColor={color}
        textFontSize={fontSize}
        onCommitText={commitText}
        onCancelText={cancelText}
      />
    </div>
  );
}

export default App;
