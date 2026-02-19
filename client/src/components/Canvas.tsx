import { useEffect } from 'react';
import type { RefObject } from 'react';
import type { RemoteCursor } from '../hooks/useCursors';
import type { TextInputState } from '../hooks/useDrawing';
import { CursorOverlay } from './CursorOverlay';
import { TextInput } from './TextInput';
import './Canvas.css';

interface CanvasProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  cursors: Map<string, RemoteCursor>;
  onMouseDown: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseMove: (e: React.MouseEvent<HTMLCanvasElement>) => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  textInput: TextInputState | null;
  textColor: string;
  textFontSize: number;
  onCommitText: (text: string) => void;
  onCancelText: () => void;
}

export function Canvas({
  canvasRef,
  cursors,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onMouseLeave,
  textInput,
  textColor,
  textFontSize,
  onCommitText,
  onCancelText,
}: CanvasProps) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;

      const { width, height } = parent.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      // Physical bitmap size (HiDPI)
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);

      // CSS display size (logical)
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      // Scale context so all drawing uses logical coordinates
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [canvasRef]);

  return (
    <div className="canvas-container">
      <canvas
        ref={canvasRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
      />
      <CursorOverlay cursors={cursors} />
      {textInput && (
        <TextInput
          position={textInput.position}
          color={textColor}
          fontSize={textFontSize}
          onCommit={onCommitText}
          onCancel={onCancelText}
        />
      )}
    </div>
  );
}
