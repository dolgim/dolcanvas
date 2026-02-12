import type { DrawPoint, DrawStroke, DrawingTool } from '@dolcanvas/shared';

/**
 * Check if a tool is a shape tool
 */
export function isShapeTool(tool: DrawingTool): boolean {
  return tool === 'rectangle' || tool === 'circle' || tool === 'line';
}

/**
 * Check if a tool is the text tool
 */
export function isTextTool(tool: DrawingTool): boolean {
  return tool === 'text';
}

/**
 * Draw text on canvas
 */
export function drawText(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  color: string,
  fontSize: number,
): void {
  ctx.fillStyle = color;
  ctx.font = `${fontSize}px sans-serif`;
  ctx.textBaseline = 'top';

  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x, y + i * fontSize * 1.2);
  }
}

/**
 * Draw a shape between two points
 */
export function drawShape(
  ctx: CanvasRenderingContext2D,
  start: DrawPoint,
  end: DrawPoint,
  color: string,
  width: number,
  tool: DrawingTool,
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();

  if (tool === 'rectangle') {
    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    const w = Math.abs(end.x - start.x);
    const h = Math.abs(end.y - start.y);
    ctx.rect(x, y, w, h);
  } else if (tool === 'circle') {
    const cx = (start.x + end.x) / 2;
    const cy = (start.y + end.y) / 2;
    const rx = Math.abs(end.x - start.x) / 2;
    const ry = Math.abs(end.y - start.y) / 2;
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  } else if (tool === 'line') {
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
  }

  ctx.stroke();
}

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

  // Text tool: delegate to drawText
  if (isTextTool(stroke.tool) && stroke.text) {
    drawText(
      ctx,
      stroke.points[0].x,
      stroke.points[0].y,
      stroke.text,
      stroke.color,
      stroke.fontSize ?? 24,
    );
    return;
  }

  // Shape tools: delegate to drawShape (uses first and last points)
  if (isShapeTool(stroke.tool) && stroke.points.length >= 2) {
    drawShape(
      ctx,
      stroke.points[0],
      stroke.points[stroke.points.length - 1],
      stroke.color,
      stroke.width,
      stroke.tool,
    );
    return;
  }

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
