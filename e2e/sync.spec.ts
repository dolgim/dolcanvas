import { test, expect } from '@playwright/test';
import { CanvasHelper } from './helpers/canvas';

test.describe('Real-time Sync', () => {
  test.beforeEach(async ({ page }) => {
    const canvas = new CanvasHelper(page);
    await canvas.goto();
    await canvas.clearCanvas();
  });

  test('drawing on page1 appears on page2', async ({ page, context }) => {
    const canvas1 = new CanvasHelper(page);

    const page2 = await context.newPage();
    const canvas2 = new CanvasHelper(page2);
    await canvas2.goto();

    const midX = 400,
      midY = 300;

    // Draw on page1
    await canvas1.drawLine(
      { x: midX - 50, y: midY },
      { x: midX + 50, y: midY },
    );

    // Verify on page2 using polling (WebSocket delivery is async)
    await expect
      .poll(() => canvas2.isDrawnAt(midX, midY), {
        message: 'Stroke should appear on page2',
        timeout: 5000,
      })
      .toBe(true);

    await page2.close();
  });

  test('clearing on page1 clears page2', async ({ page, context }) => {
    const canvas1 = new CanvasHelper(page);

    const page2 = await context.newPage();
    const canvas2 = new CanvasHelper(page2);
    await canvas2.goto();

    const midX = 400,
      midY = 300;

    // Draw on page1
    await canvas1.drawLine(
      { x: midX - 50, y: midY },
      { x: midX + 50, y: midY },
    );

    // Wait for sync
    await expect
      .poll(() => canvas2.isDrawnAt(midX, midY), { timeout: 5000 })
      .toBe(true);

    // Clear on page1
    await canvas1.clearCanvas();

    // Verify cleared on page2
    await expect
      .poll(() => canvas2.isDrawnAt(midX, midY), {
        message: 'Canvas should be cleared on page2',
        timeout: 5000,
      })
      .toBe(false);

    await page2.close();
  });

  test('new page receives existing strokes via sync', async ({
    page,
    context,
  }) => {
    const canvas1 = new CanvasHelper(page);

    const midX = 400,
      midY = 300;

    // Draw something before page2 connects
    await canvas1.drawLine(
      { x: midX - 50, y: midY },
      { x: midX + 50, y: midY },
    );

    // Open page2 after drawing
    const page2 = await context.newPage();
    const canvas2 = new CanvasHelper(page2);
    await canvas2.goto();

    // New page should receive existing strokes via sync message
    await expect
      .poll(() => canvas2.isDrawnAt(midX, midY), {
        message: 'New page should receive existing strokes',
        timeout: 5000,
      })
      .toBe(true);

    await page2.close();
  });
});
