import { test, expect } from '@playwright/test';
import { CanvasHelper } from './helpers/canvas';

test.describe('Tool Switching', () => {
  let canvas: CanvasHelper;

  test.beforeEach(async ({ page }) => {
    canvas = new CanvasHelper(page);
    await canvas.goto();
    await canvas.clearCanvas();
  });

  test('rectangle tool draws a rectangle', async () => {
    await canvas.selectTool('rectangle');

    const x1 = 200,
      y1 = 200,
      x2 = 350,
      y2 = 300;
    await canvas.drawLine({ x: x1, y: y1 }, { x: x2, y: y2 });

    // Top edge midpoint should be drawn
    expect(await canvas.isDrawnAt((x1 + x2) / 2, y1)).toBe(true);
    // Left edge midpoint should be drawn
    expect(await canvas.isDrawnAt(x1, (y1 + y2) / 2)).toBe(true);
    // Interior should be empty (unfilled rectangle)
    expect(await canvas.isDrawnAt((x1 + x2) / 2, (y1 + y2) / 2)).toBe(false);
  });

  test('circle tool draws an ellipse', async () => {
    await canvas.selectTool('circle');

    const x1 = 200,
      y1 = 200,
      x2 = 400,
      y2 = 350;
    await canvas.drawLine({ x: x1, y: y1 }, { x: x2, y: y2 });

    // Top of ellipse (center x, y1) should be drawn
    expect(await canvas.isDrawnAt((x1 + x2) / 2, y1)).toBe(true);
    // Center should be empty (unfilled)
    expect(await canvas.isDrawnAt((x1 + x2) / 2, (y1 + y2) / 2)).toBe(false);
  });

  test('line tool draws a straight line', async () => {
    await canvas.selectTool('line');

    const x1 = 200,
      y1 = 200,
      x2 = 400,
      y2 = 200;
    await canvas.drawLine({ x: x1, y: y1 }, { x: x2, y: y2 });

    // Midpoint of the line should be drawn
    expect(await canvas.isDrawnAt(300, 200)).toBe(true);
    // Well above the line should be empty
    expect(await canvas.isDrawnAt(300, 150)).toBe(false);
  });

  test('eraser removes drawn content', async () => {
    const midX = 400,
      midY = 300;

    // Draw something first with pen
    await canvas.selectTool('pen');
    await canvas.drawLine(
      { x: midX - 50, y: midY },
      { x: midX + 50, y: midY },
    );
    expect(await canvas.isDrawnAt(midX, midY)).toBe(true);

    // Erase over it
    await canvas.selectTool('eraser');
    await canvas.drawLine(
      { x: midX - 60, y: midY },
      { x: midX + 60, y: midY },
    );

    expect(await canvas.isDrawnAt(midX, midY)).toBe(false);
  });

  test('text tool places text on the canvas', async ({ page }) => {
    await canvas.selectTool('text');

    // Click on canvas to open the text input
    const pos = await canvas.toPageCoords(300, 200);
    await page.mouse.click(pos.x, pos.y);

    // Wait for the textarea to appear and type text character by character
    const textarea = page.locator('textarea.canvas-text-input');
    await expect(textarea).toBeVisible();
    await textarea.pressSequentially('Hello');
    await textarea.press('Enter');

    // Wait for text to be rendered on the canvas
    await expect
      .poll(() => canvas.isDrawnAt(310, 210), {
        message: 'Text should be rendered on canvas',
        timeout: 3000,
      })
      .toBe(true);
  });
});
