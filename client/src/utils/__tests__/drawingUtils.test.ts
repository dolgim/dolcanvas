import type { DrawPoint, DrawStroke, DrawingTool } from '@dolcanvas/shared';
import { describe, expect, it } from 'vitest';
import {
  constrainEndPoint,
  drawLineSegment,
  drawShape,
  drawStroke,
  drawText,
  isShapeTool,
  isTextTool,
  redrawAllStrokes,
} from '../drawingUtils';
import { createMockContext } from './helpers/mockCanvasContext';

// Helper to create a DrawPoint
function point(x: number, y: number): DrawPoint {
  return { x, y, timestamp: Date.now() };
}

// Helper to create a DrawStroke
function stroke(overrides: Partial<DrawStroke> = {}): DrawStroke {
  return {
    id: 'test-id',
    points: [point(0, 0), point(10, 10)],
    color: '#000000',
    width: 2,
    tool: 'pen',
    userId: 'user-1',
    ...overrides,
  };
}

describe('isShapeTool', () => {
  it.each<[DrawingTool, boolean]>([
    ['rectangle', true],
    ['circle', true],
    ['line', true],
    ['pen', false],
    ['eraser', false],
    ['text', false],
  ])('should return %s for tool "%s"', (tool, expected) => {
    expect(isShapeTool(tool)).toBe(expected);
  });
});

describe('isTextTool', () => {
  it.each<[DrawingTool, boolean]>([
    ['text', true],
    ['pen', false],
    ['eraser', false],
    ['rectangle', false],
    ['circle', false],
    ['line', false],
  ])('should return %s for tool "%s"', (tool, expected) => {
    expect(isTextTool(tool)).toBe(expected);
  });
});

describe('drawText', () => {
  it('should draw a single line of text', () => {
    const ctx = createMockContext();
    drawText(ctx, 10, 20, 'Hello', '#ff0000', 16);

    expect(ctx.fillStyle).toBe('#ff0000');
    expect(ctx.font).toBe('16px sans-serif');
    expect(ctx.textBaseline).toBe('top');
    expect(ctx.fillText).toHaveBeenCalledWith('Hello', 10, 20);
  });

  it('should draw multiple lines split by newline', () => {
    const ctx = createMockContext();
    drawText(ctx, 10, 20, 'Line1\nLine2\nLine3', '#000', 20);

    expect(ctx.fillText).toHaveBeenCalledTimes(3);
    expect(ctx.fillText).toHaveBeenCalledWith('Line1', 10, 20);
    expect(ctx.fillText).toHaveBeenCalledWith('Line2', 10, 20 + 20 * 1.2);
    expect(ctx.fillText).toHaveBeenCalledWith('Line3', 10, 20 + 2 * 20 * 1.2);
  });
});

describe('drawShape', () => {
  it('should draw a rectangle with ctx.rect', () => {
    const ctx = createMockContext();
    const start = point(10, 20);
    const end = point(50, 60);

    drawShape(ctx, start, end, '#00f', 3, 'rectangle');

    expect(ctx.strokeStyle).toBe('#00f');
    expect(ctx.lineWidth).toBe(3);
    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.rect).toHaveBeenCalledWith(10, 20, 40, 40);
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it('should handle reverse-direction rectangle (end < start)', () => {
    const ctx = createMockContext();
    const start = point(50, 60);
    const end = point(10, 20);

    drawShape(ctx, start, end, '#00f', 3, 'rectangle');

    expect(ctx.rect).toHaveBeenCalledWith(10, 20, 40, 40);
  });

  it('should draw a circle with ctx.ellipse', () => {
    const ctx = createMockContext();
    const start = point(0, 0);
    const end = point(100, 60);

    drawShape(ctx, start, end, '#0f0', 2, 'circle');

    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.ellipse).toHaveBeenCalledWith(50, 30, 50, 30, 0, 0, Math.PI * 2);
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it('should draw a line with moveTo and lineTo', () => {
    const ctx = createMockContext();
    const start = point(5, 10);
    const end = point(50, 80);

    drawShape(ctx, start, end, '#f00', 1, 'line');

    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.moveTo).toHaveBeenCalledWith(5, 10);
    expect(ctx.lineTo).toHaveBeenCalledWith(50, 80);
    expect(ctx.stroke).toHaveBeenCalled();
  });
});

describe('drawLineSegment', () => {
  it('should draw a pen segment with source-over composite', () => {
    const ctx = createMockContext();
    drawLineSegment(ctx, point(0, 0), point(10, 10), '#000', 2, 'pen');

    expect(ctx.globalCompositeOperation).toBe('source-over');
    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.moveTo).toHaveBeenCalledWith(0, 0);
    expect(ctx.lineTo).toHaveBeenCalledWith(10, 10);
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it('should use destination-out for eraser and restore afterward', () => {
    const ctx = createMockContext();
    drawLineSegment(ctx, point(0, 0), point(10, 10), '#000', 5, 'eraser');

    // After the call, composite operation should be restored
    expect(ctx.globalCompositeOperation).toBe('source-over');
    expect(ctx.stroke).toHaveBeenCalled();
  });
});

describe('drawStroke', () => {
  it('should return early for empty points', () => {
    const ctx = createMockContext();
    drawStroke(ctx, stroke({ points: [] }));

    expect(ctx.beginPath).not.toHaveBeenCalled();
    expect(ctx.fillText).not.toHaveBeenCalled();
  });

  it('should delegate text strokes to drawText', () => {
    const ctx = createMockContext();
    const textStroke = stroke({
      tool: 'text',
      text: 'Hello',
      fontSize: 24,
      points: [point(10, 20)],
    });

    drawStroke(ctx, textStroke);

    expect(ctx.fillText).toHaveBeenCalledWith('Hello', 10, 20);
    // Should not call stroke-related methods
    expect(ctx.beginPath).not.toHaveBeenCalled();
  });

  it('should delegate shape strokes to drawShape', () => {
    const ctx = createMockContext();
    const rectStroke = stroke({
      tool: 'rectangle',
      points: [point(0, 0), point(50, 50)],
    });

    drawStroke(ctx, rectStroke);

    expect(ctx.rect).toHaveBeenCalled();
  });

  it('should draw pen strokes through all points', () => {
    const ctx = createMockContext();
    const penStroke = stroke({
      tool: 'pen',
      points: [point(0, 0), point(10, 10), point(20, 5)],
    });

    drawStroke(ctx, penStroke);

    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.moveTo).toHaveBeenCalledWith(0, 0);
    expect(ctx.lineTo).toHaveBeenCalledWith(10, 10);
    expect(ctx.lineTo).toHaveBeenCalledWith(20, 5);
    expect(ctx.stroke).toHaveBeenCalled();
  });

  it('should set destination-out for eraser strokes', () => {
    const ctx = createMockContext();
    const eraserStroke = stroke({
      tool: 'eraser',
      points: [point(0, 0), point(10, 10)],
    });

    drawStroke(ctx, eraserStroke);

    // Should be restored after drawing
    expect(ctx.globalCompositeOperation).toBe('source-over');
    expect(ctx.stroke).toHaveBeenCalled();
  });
});

describe('redrawAllStrokes', () => {
  it('should clear canvas and redraw all strokes', () => {
    const ctx = createMockContext();
    const strokes = [
      stroke({ points: [point(0, 0), point(10, 10)] }),
      stroke({ points: [point(20, 20), point(30, 30)] }),
    ];

    // Mock window.devicePixelRatio
    const originalDpr = window.devicePixelRatio;
    Object.defineProperty(window, 'devicePixelRatio', { value: 2, writable: true });

    redrawAllStrokes(ctx, strokes, 800, 600);

    expect(ctx.setTransform).toHaveBeenCalledWith(2, 0, 0, 2, 0, 0);
    expect(ctx.fillStyle).toBe('white');
    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 800, 600);
    // Each stroke should trigger beginPath + moveTo + lineTo + stroke
    expect(ctx.beginPath).toHaveBeenCalledTimes(2);

    Object.defineProperty(window, 'devicePixelRatio', { value: originalDpr, writable: true });
  });

  it('should handle empty strokes array', () => {
    const ctx = createMockContext();

    redrawAllStrokes(ctx, [], 800, 600);

    expect(ctx.fillRect).toHaveBeenCalledWith(0, 0, 800, 600);
    expect(ctx.beginPath).not.toHaveBeenCalled();
  });
});

describe('constrainEndPoint', () => {
  it('should return end as-is when shiftKey is false', () => {
    const start = point(0, 0);
    const end = point(100, 50);
    const result = constrainEndPoint(start, end, 'rectangle', false);
    expect(result).toBe(end);
  });

  it('should return end as-is for non-shape tools even with shiftKey', () => {
    const start = point(0, 0);
    const end = point(100, 50);

    expect(constrainEndPoint(start, end, 'pen', true)).toBe(end);
    expect(constrainEndPoint(start, end, 'eraser', true)).toBe(end);
    expect(constrainEndPoint(start, end, 'text', true)).toBe(end);
  });

  describe('rectangle + shift', () => {
    it('should constrain to square using larger dimension (width > height)', () => {
      const start = point(10, 10);
      const end = point(110, 60); // dx=100, dy=50 → size=100
      const result = constrainEndPoint(start, end, 'rectangle', true);
      expect(result.x).toBe(110);
      expect(result.y).toBe(110);
    });

    it('should constrain to square using larger dimension (height > width)', () => {
      const start = point(10, 10);
      const end = point(60, 110); // dx=50, dy=100 → size=100
      const result = constrainEndPoint(start, end, 'rectangle', true);
      expect(result.x).toBe(110);
      expect(result.y).toBe(110);
    });

    it('should preserve negative direction', () => {
      const start = point(100, 100);
      const end = point(30, 60); // dx=-70, dy=-40 → size=70
      const result = constrainEndPoint(start, end, 'rectangle', true);
      expect(result.x).toBe(30);  // 100 + (-70)
      expect(result.y).toBe(30);  // 100 + (-70)
    });
  });

  describe('circle + shift', () => {
    it('should constrain to square bounding box (same as rectangle)', () => {
      const start = point(0, 0);
      const end = point(80, 50); // dx=80, dy=50 → size=80
      const result = constrainEndPoint(start, end, 'circle', true);
      expect(result.x).toBe(80);
      expect(result.y).toBe(80);
    });
  });

  describe('line + shift', () => {
    it('should snap to 0° (horizontal) for near-horizontal angle', () => {
      const start = point(0, 0);
      const end = point(100, 10); // angle ≈ 5.7°
      const result = constrainEndPoint(start, end, 'line', true);
      const distance = Math.sqrt(100 * 100 + 10 * 10);
      expect(result.x).toBeCloseTo(distance); // cos(0) * distance
      expect(result.y).toBeCloseTo(0);         // sin(0) * distance
    });

    it('should snap to 90° (vertical) for near-vertical angle', () => {
      const start = point(0, 0);
      const end = point(10, 100); // angle ≈ 84.3°
      const result = constrainEndPoint(start, end, 'line', true);
      const distance = Math.sqrt(10 * 10 + 100 * 100);
      expect(result.x).toBeCloseTo(0);
      expect(result.y).toBeCloseTo(distance);
    });

    it('should snap to 45° for diagonal angle', () => {
      const start = point(0, 0);
      const end = point(80, 70); // angle ≈ 41.2°
      const result = constrainEndPoint(start, end, 'line', true);
      const distance = Math.sqrt(80 * 80 + 70 * 70);
      const cos45 = Math.cos(Math.PI / 4);
      expect(result.x).toBeCloseTo(distance * cos45);
      expect(result.y).toBeCloseTo(distance * cos45);
    });

    it('should preserve distance after snapping', () => {
      const start = point(50, 50);
      const end = point(130, 55);
      const dx = 80, dy = 5;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const result = constrainEndPoint(start, end, 'line', true);
      const resultDist = Math.sqrt(
        (result.x - 50) ** 2 + (result.y - 50) ** 2,
      );
      expect(resultDist).toBeCloseTo(distance);
    });
  });
});
