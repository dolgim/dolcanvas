import { useRef, useState, useCallback, RefObject } from 'react';
import type { DrawStroke, DrawPoint } from '@dolcanvas/shared';
import { generateStrokeId, generateUserId } from '../utils/idGenerator';
import { drawLineSegment, redrawAllStrokes } from '../utils/drawingUtils';

const USER_ID = generateUserId();

interface UseDrawingOptions {
  canvasRef: RefObject<HTMLCanvasElement>;
}

export function useDrawing({ canvasRef }: UseDrawingOptions) {
  const [strokes, setStrokes] = useState<DrawStroke[]>([]);
  const [color, setColor] = useState('#000000');
  const [width, setWidth] = useState(2);

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
        tool: 'pen',
        userId: USER_ID,
      };
    },
    [canvasRef, getCanvasPoint, color, width],
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
      drawLineSegment(ctx, lastPoint, point, stroke.color, stroke.width);

      // Add point to current stroke
      stroke.points.push(point);
    },
    [canvasRef, getCanvasPoint],
  );

  const handleMouseUp = useCallback(() => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return;

    // Add finished stroke to strokes array
    setStrokes((prev) => [...prev, currentStrokeRef.current!]);

    isDrawingRef.current = false;
    currentStrokeRef.current = null;
  }, []);

  const handleMouseLeave = useCallback(() => {
    if (!isDrawingRef.current || !currentStrokeRef.current) return;

    // Add finished stroke to strokes array
    setStrokes((prev) => [...prev, currentStrokeRef.current!]);

    isDrawingRef.current = false;
    currentStrokeRef.current = null;
  }, []);

  const handleClear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    setStrokes([]);
    redrawAllStrokes(ctx, [], canvas.width, canvas.height);
  }, [canvasRef]);

  return {
    strokes,
    color,
    width,
    setColor,
    setWidth,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleMouseLeave,
    handleClear,
  };
}
