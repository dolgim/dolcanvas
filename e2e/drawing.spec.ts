import { test, expect } from '@playwright/test';
import { CanvasHelper } from './helpers/canvas';

test.describe('Basic Drawing', () => {
  let canvas: CanvasHelper;

  test.beforeEach(async ({ page }) => {
    canvas = new CanvasHelper(page);
    await canvas.goto();
    await canvas.clearCanvas();
  });

  test('draws a pen stroke on the canvas', async () => {
    const midX = 400;
    const midY = 300;

    await canvas.drawLine({ x: midX - 50, y: midY }, { x: midX + 50, y: midY });

    expect(await canvas.isDrawnAt(midX, midY)).toBe(true);
  });

  test('clearing the canvas removes all strokes', async () => {
    const midX = 400;
    const midY = 300;

    await canvas.drawLine({ x: midX - 50, y: midY }, { x: midX + 50, y: midY });
    expect(await canvas.isDrawnAt(midX, midY)).toBe(true);

    await canvas.clearCanvas();

    expect(await canvas.isDrawnAt(midX, midY)).toBe(false);
  });

  test('drawing with a different color produces the correct color', async () => {
    await canvas.selectColor('Red');

    const midX = 400;
    const midY = 300;
    await canvas.drawLine({ x: midX - 50, y: midY }, { x: midX + 50, y: midY });

    const pixel = await canvas.getPixelColor(midX, midY);
    // Red channel dominant (anti-aliasing may affect exact values)
    expect(pixel.r).toBeGreaterThan(200);
    expect(pixel.g).toBeLessThan(100);
    expect(pixel.b).toBeLessThan(100);
  });
});
