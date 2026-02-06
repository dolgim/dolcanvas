import type { DrawPoint, DrawStroke, DrawingTool } from '@dolcanvas/shared';

/**
 * Draw a line segment between two points (for real-time drawing)
 */
export function drawLineSegment(
  ctx: CanvasRenderingContext2D,
  from: DrawPoint,
  to: DrawPoint,
  color: string,
  width: number,
  tool: DrawingTool = 'pen',
): void {
  // Set composite operation for eraser
  if (tool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
  }

  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();

  // Restore composite operation
  if (tool === 'eraser') {
    ctx.globalCompositeOperation = 'source-over';
  }
}

/**
 * Draw a complete stroke (for rendering finished strokes)
 */
export function drawStroke(
  ctx: CanvasRenderingContext2D,
  stroke: DrawStroke,
): void {
  if (stroke.points.length === 0) return;

  // Set composite operation for eraser
  if (stroke.tool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
  }

  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

  for (let i = 1; i < stroke.points.length; i++) {
    ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
  }

  ctx.stroke();

  // Restore composite operation
  if (stroke.tool === 'eraser') {
    ctx.globalCompositeOperation = 'source-over';
  }
}

/**
 * Redraw all strokes (for canvas clear and redraw)
 */
export function redrawAllStrokes(
  ctx: CanvasRenderingContext2D,
  strokes: DrawStroke[],
  width: number,
  height: number,
): void {
  // Clear canvas
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, height);

  // Draw all strokes
  strokes.forEach((stroke) => drawStroke(ctx, stroke));
}
