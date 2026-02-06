import { useRef, useState, useCallback, RefObject } from 'react';
import type {
  DrawStroke,
  DrawPoint,
  DrawingTool,
  WSMessage,
  DrawMessagePayload,
  ClearMessagePayload,
} from '@dolcanvas/shared';
import { generateStrokeId, generateUserId } from '../utils/idGenerator';
import {
  drawLineSegment,
  drawStroke,
  redrawAllStrokes,
} from '../utils/drawingUtils';

const USER_ID = generateUserId();

interface UseDrawingOptions {
  canvasRef: RefObject<HTMLCanvasElement>;
  sendMessage?: <T>(message: WSMessage<T>) => void;
}

export function useDrawing({ canvasRef, sendMessage }: UseDrawingOptions) {
  const [strokes, setStrokes] = useState<DrawStroke[]>([]);
  const [color, setColor] = useState('#000000');
  const [width, setWidth] = useState(2);
  const [tool, setTool] = useState<DrawingTool>('pen');

  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef<DrawStroke | null>(null);

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
      const lastPoint = stroke.points[stroke.points.length - 1];

      // Draw line segment immediately (imperative rendering)
      drawLineSegment(ctx, lastPoint, point, stroke.color, stroke.width, stroke.tool);

      // Add point to current stroke
      stroke.points.push(point);
    },
    [canvasRef, getCanvasPoint],
  );

  const handleMouseUp = useCallback(() => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return;

    const finishedStroke = currentStrokeRef.current;

    // Add finished stroke to strokes array
    setStrokes((prev) => [...prev, finishedStroke]);

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
  }, [sendMessage]);

  const handleMouseLeave = useCallback(() => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return;

    const finishedStroke = currentStrokeRef.current;

    // Add finished stroke to strokes array
    setStrokes((prev) => [...prev, finishedStroke]);

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
  }, [sendMessage]);

  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    setStrokes([]);
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
    redrawAllStrokes(ctx, [], canvas.width, canvas.height);
  }, [canvasRef]);

  // Handle sync message (initial state from server)
  const handleSync = useCallback(
    (syncStrokes: DrawStroke[]) => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      setStrokes(syncStrokes);
      redrawAllStrokes(ctx, syncStrokes, canvas.width, canvas.height);
    },
    [canvasRef],
  );

  return {
    strokes,
    color,
    width,
    tool,
    userId: USER_ID,
    setColor,
    setWidth,
    setTool,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleClear,
    handleRemoteStroke,
    handleRemoteClear,
    handleSync,
  };
}
