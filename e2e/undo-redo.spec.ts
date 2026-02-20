import { test, expect } from '@playwright/test';
import { CanvasHelper } from './helpers/canvas';

test.describe('Undo / Redo', () => {
  let canvas: CanvasHelper;

  test.beforeEach(async ({ page }) => {
    canvas = new CanvasHelper(page);
    await canvas.goto();
    await canvas.clearCanvas();
  });

  test('undo removes the last stroke', async ({ page }) => {
    const midX = 400,
      midY = 300;

    await canvas.drawLine(
      { x: midX - 50, y: midY },
      { x: midX + 50, y: midY },
    );
    expect(await canvas.isDrawnAt(midX, midY)).toBe(true);

    // Wait for React to process the state update (Undo button becomes enabled)
    await expect(page.getByLabel('Undo')).toBeEnabled();
    await canvas.undo();

    expect(await canvas.isDrawnAt(midX, midY)).toBe(false);
  });

  test('redo restores the undone stroke', async ({ page }) => {
    const midX = 400,
      midY = 300;

    await canvas.drawLine(
      { x: midX - 50, y: midY },
      { x: midX + 50, y: midY },
    );

    await expect(page.getByLabel('Undo')).toBeEnabled();
    await canvas.undo();
    expect(await canvas.isDrawnAt(midX, midY)).toBe(false);

    await canvas.redo();

    expect(await canvas.isDrawnAt(midX, midY)).toBe(true);
  });

  test('Ctrl+Z and Ctrl+Shift+Z keyboard shortcuts work', async ({ page }) => {
    const midX = 400,
      midY = 300;

    await canvas.drawLine(
      { x: midX - 50, y: midY },
      { x: midX + 50, y: midY },
    );
    expect(await canvas.isDrawnAt(midX, midY)).toBe(true);

    // Wait for React re-render before keyboard undo
    await expect(page.getByLabel('Undo')).toBeEnabled();

    // Undo with Ctrl+Z
    await page.keyboard.press('Control+z');
    expect(await canvas.isDrawnAt(midX, midY)).toBe(false);

    // Redo with Ctrl+Shift+Z
    await page.keyboard.press('Control+Shift+z');
    expect(await canvas.isDrawnAt(midX, midY)).toBe(true);
  });

  test('undo on tab1 syncs to tab2', async ({ page, context }) => {
    const canvas1 = new CanvasHelper(page);

    const page2 = await context.newPage();
    const canvas2 = new CanvasHelper(page2);
    await canvas2.goto();

    const midX = 400,
      midY = 300;

    // Draw on tab1
    await canvas1.drawLine(
      { x: midX - 50, y: midY },
      { x: midX + 50, y: midY },
    );

    // Wait for sync to tab2
    await expect
      .poll(() => canvas2.isDrawnAt(midX, midY), { timeout: 5000 })
      .toBe(true);

    // Wait for React to process state update before undo
    await expect(page.getByLabel('Undo')).toBeEnabled();
    await canvas1.undo();

    // Should disappear on tab2
    await expect
      .poll(() => canvas2.isDrawnAt(midX, midY), {
        message: 'Undo should sync to tab2',
        timeout: 5000,
      })
      .toBe(false);

    await page2.close();
  });
});
