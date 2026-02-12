import { useRef, useState, useCallback } from 'react';
import type { RefObject } from 'react';
import type {
  DrawStroke,
  DrawPoint,
  DrawingTool,
  WSMessage,
  DrawMessagePayload,
  ClearMessagePayload,
  UndoMessagePayload,
  RedoMessagePayload,
} from '@dolcanvas/shared';
import { generateStrokeId, generateUserId } from '../utils/idGenerator';
import {
  drawLineSegment,
  drawShape,
  drawStroke,
  isShapeTool,
  redrawAllStrokes,
} from '../utils/drawingUtils';

const USER_ID = generateUserId();

interface UseDrawingOptions {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  sendMessage?: <T>(message: WSMessage<T>) => void;
}

export function useDrawing({ canvasRef, sendMessage }: UseDrawingOptions) {
  const [strokes, setStrokes] = useState<DrawStroke[]>([]);
  const [redoStack, setRedoStack] = useState<DrawStroke[]>([]);
  const [color, setColor] = useState('#000000');
  const [width, setWidth] = useState(2);
  const [tool, setTool] = useState<DrawingTool>('pen');

  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef<DrawStroke | null>(null);
  const canvasSnapshotRef = useRef<ImageData | null>(null);
  const shapeStartPointRef = useRef<DrawPoint | null>(null);
  const lastPointRef = useRef<DrawPoint | null>(null);
  const strokesChangedDuringDragRef = useRef(false);

  const getCanvasPoint = useCallback(
    (clientX: number, clientY: number): DrawPoint | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
        timestamp: Date.now(),
      };
    },
    [canvasRef],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const point = getCanvasPoint(e.clientX, e.clientY);
      if (!point) return;

      isDrawingRef.current = true;
      currentStrokeRef.current = {
        id: generateStrokeId(),
        points: [point],
        color,
        width,
        tool,
        userId: USER_ID,
      };

      // Shape tools: save canvas snapshot for preview rendering
      if (isShapeTool(tool)) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvasSnapshotRef.current = ctx.getImageData(
            0,
            0,
            canvas.width,
            canvas.height,
          );
        }
        shapeStartPointRef.current = point;
        lastPointRef.current = point;
        strokesChangedDuringDragRef.current = false;
      }
    },
    [canvasRef, getCanvasPoint, color, width, tool],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current || !currentStrokeRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      const point = getCanvasPoint(e.clientX, e.clientY);
      if (!point) return;

      const stroke = currentStrokeRef.current;

      if (isShapeTool(stroke.tool)) {
        // Shape tools: restore snapshot then draw preview
        if (canvasSnapshotRef.current) {
          ctx.putImageData(canvasSnapshotRef.current, 0, 0);
        }
        if (shapeStartPointRef.current) {
          drawShape(
            ctx,
            shapeStartPointRef.current,
            point,
            stroke.color,
            stroke.width,
            stroke.tool,
          );
        }
        lastPointRef.current = point;
      } else {
        // Pen/eraser: additive rendering
        const lastPoint = stroke.points[stroke.points.length - 1];
        drawLineSegment(
          ctx,
          lastPoint,
          point,
          stroke.color,
          stroke.width,
          stroke.tool,
        );
        stroke.points.push(point);
      }
    },
    [canvasRef, getCanvasPoint],
  );

  const handleMouseUp = useCallback(() => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return;

    const finishedStroke = currentStrokeRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    // Shape tools: finalize with start and end points
    if (isShapeTool(finishedStroke.tool)) {
      const start = shapeStartPointRef.current;
      const end = lastPointRef.current;

      // Ignore zero-size shapes (click without drag)
      if (
        !start ||
        !end ||
        (start.x === end.x && start.y === end.y)
      ) {
        // Restore snapshot to clear any preview
        if (ctx && canvasSnapshotRef.current) {
          ctx.putImageData(canvasSnapshotRef.current, 0, 0);
        }
        isDrawingRef.current = false;
        currentStrokeRef.current = null;
        canvasSnapshotRef.current = null;
        shapeStartPointRef.current = null;
        lastPointRef.current = null;
        return;
      }

      finishedStroke.points = [start, end];

      // If remote strokes arrived during drag, do full redraw
      if (canvas && ctx && strokesChangedDuringDragRef.current) {
        setStrokes((prev) => {
          const newStrokes = [...prev, finishedStroke];
          redrawAllStrokes(ctx, newStrokes, canvas.width, canvas.height);
          return newStrokes;
        });
      } else {
        // Restore snapshot and draw final shape
        if (ctx && canvasSnapshotRef.current) {
          ctx.putImageData(canvasSnapshotRef.current, 0, 0);
        }
        if (ctx) {
          drawShape(ctx, start, end, finishedStroke.color, finishedStroke.width, finishedStroke.tool);
        }
        setStrokes((prev) => [...prev, finishedStroke]);
      }

      canvasSnapshotRef.current = null;
      shapeStartPointRef.current = null;
      lastPointRef.current = null;
    } else {
      // Pen/eraser: add finished stroke
      setStrokes((prev) => [...prev, finishedStroke]);
    }

    setRedoStack([]);

    // Send to server
    if (sendMessage) {
      const message: WSMessage<DrawMessagePayload> = {
        type: 'draw',
        payload: { stroke: finishedStroke },
        timestamp: Date.now(),
      };
      sendMessage(message);
    }

    isDrawingRef.current = false;
    currentStrokeRef.current = null;
  }, [canvasRef, sendMessage]);

  const handleMouseLeave = useCallback(() => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return;

    const finishedStroke = currentStrokeRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    // Shape tools: finalize with start and last tracked point
    if (isShapeTool(finishedStroke.tool)) {
      const start = shapeStartPointRef.current;
      const end = lastPointRef.current;

      // Ignore zero-size shapes
      if (
        !start ||
        !end ||
        (start.x === end.x && start.y === end.y)
      ) {
        if (ctx && canvasSnapshotRef.current) {
          ctx.putImageData(canvasSnapshotRef.current, 0, 0);
        }
        isDrawingRef.current = false;
        currentStrokeRef.current = null;
        canvasSnapshotRef.current = null;
        shapeStartPointRef.current = null;
        lastPointRef.current = null;
        return;
      }

      finishedStroke.points = [start, end];

      if (canvas && ctx && strokesChangedDuringDragRef.current) {
        setStrokes((prev) => {
          const newStrokes = [...prev, finishedStroke];
          redrawAllStrokes(ctx, newStrokes, canvas.width, canvas.height);
          return newStrokes;
        });
      } else {
        if (ctx && canvasSnapshotRef.current) {
          ctx.putImageData(canvasSnapshotRef.current, 0, 0);
        }
        if (ctx) {
          drawShape(ctx, start, end, finishedStroke.color, finishedStroke.width, finishedStroke.tool);
        }
        setStrokes((prev) => [...prev, finishedStroke]);
      }

      canvasSnapshotRef.current = null;
      shapeStartPointRef.current = null;
      lastPointRef.current = null;
    } else {
      setStrokes((prev) => [...prev, finishedStroke]);
    }

    setRedoStack([]);

    // Send to server
    if (sendMessage) {
      const message: WSMessage<DrawMessagePayload> = {
        type: 'draw',
        payload: { stroke: finishedStroke },
        timestamp: Date.now(),
      };
      sendMessage(message);
    }

    isDrawingRef.current = false;
    currentStrokeRef.current = null;
  }, [canvasRef, sendMessage]);

  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    setStrokes([]);
    setRedoStack([]);
    redrawAllStrokes(ctx, [], canvas.width, canvas.height);

    // Send to server
    if (sendMessage) {
      const message: WSMessage<ClearMessagePayload> = {
        type: 'clear',
        payload: { userId: USER_ID },
        timestamp: Date.now(),
      };
      sendMessage(message);
    }
  }, [canvasRef, sendMessage]);

  // Handle remote stroke from other users
  const handleRemoteStroke = useCallback(
    (stroke: DrawStroke) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      // Flag that strokes changed during shape drag (for full redraw on mouseUp)
      if (
        isDrawingRef.current &&
        currentStrokeRef.current &&
        isShapeTool(currentStrokeRef.current.tool)
      ) {
        strokesChangedDuringDragRef.current = true;
      }

      // Add to state
      setStrokes((prev) => [...prev, stroke]);

      // Draw immediately
      drawStroke(ctx, stroke);
    },
    [canvasRef],
  );

  // Handle remote clear from other users
  const handleRemoteClear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    setStrokes([]);
    setRedoStack([]);
    redrawAllStrokes(ctx, [], canvas.width, canvas.height);
  }, [canvasRef]);

  // Handle sync message (initial state from server)
  const handleSync = useCallback(
    (syncStrokes: DrawStroke[]) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      setStrokes(syncStrokes);
      setRedoStack([]);
      redrawAllStrokes(ctx, syncStrokes, canvas.width, canvas.height);
    },
    [canvasRef],
  );

  // Undo: remove the last stroke by this user
  const handleUndo = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Find the last stroke by this user
    let lastIndex = -1;
    for (let i = strokes.length - 1; i >= 0; i--) {
      if (strokes[i].userId === USER_ID) {
        lastIndex = i;
        break;
      }
    }
    if (lastIndex === -1) return;

    const undoneStroke = strokes[lastIndex];
    const newStrokes = strokes.filter((_, i) => i !== lastIndex);

    setStrokes(newStrokes);
    setRedoStack((prev) => [...prev, undoneStroke]);
    redrawAllStrokes(ctx, newStrokes, canvas.width, canvas.height);

    // Send to server
    if (sendMessage) {
      const message: WSMessage<UndoMessagePayload> = {
        type: 'undo',
        payload: { userId: USER_ID, strokeId: undoneStroke.id },
        timestamp: Date.now(),
      };
      sendMessage(message);
    }
  }, [canvasRef, strokes, sendMessage]);

  // Redo: restore the last undone stroke
  const handleRedo = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    if (redoStack.length === 0) return;

    const restoredStroke = redoStack[redoStack.length - 1];

    setRedoStack((prev) => prev.slice(0, -1));
    setStrokes((prev) => [...prev, restoredStroke]);
    drawStroke(ctx, restoredStroke);

    // Send to server
    if (sendMessage) {
      const message: WSMessage<RedoMessagePayload> = {
        type: 'redo',
        payload: { userId: USER_ID, stroke: restoredStroke },
        timestamp: Date.now(),
      };
      sendMessage(message);
    }
  }, [canvasRef, redoStack, sendMessage]);

  // Handle remote undo from other users
  const handleRemoteUndo = useCallback(
    (strokeId: string) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      setStrokes((prev) => {
        const newStrokes = prev.filter((s) => s.id !== strokeId);
        redrawAllStrokes(ctx, newStrokes, canvas.width, canvas.height);
        return newStrokes;
      });
    },
    [canvasRef],
  );

  // Handle remote redo from other users (reuse handleRemoteStroke logic)
  const canUndo = strokes.some((s) => s.userId === USER_ID);
  const canRedo = redoStack.length > 0;

  return {
    strokes,
    color,
    width,
    tool,
    userId: USER_ID,
    canUndo,
    canRedo,
    setColor,
    setWidth,
    setTool,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleClear,
    handleUndo,
    handleRedo,
    handleRemoteStroke,
    handleRemoteClear,
    handleRemoteUndo,
    handleSync,
  };
}
