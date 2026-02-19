import type { Page, ConsoleMessage } from '@playwright/test';

export class CanvasHelper {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to the app and wait for the canvas and WebSocket to be ready.
   * Listens for the "WebSocket connected" console message and, if a
   * disconnect is observed (React strict mode double-mount), waits for the
   * subsequent reconnect.
   */
  async goto(path = '/'): Promise<void> {
    let connectedCount = 0;
    let sawDisconnect = false;

    const handler = (msg: ConsoleMessage) => {
      const text = msg.text();
      if (text === 'WebSocket connected') connectedCount++;
      if (text.includes('WebSocket disconnected')) sawDisconnect = true;
    };

    this.page.on('console', handler);

    await this.page.goto(path);
    await this.page.locator('canvas').waitFor({ state: 'visible' });

    // Wait for the first "WebSocket connected"
    const deadline = Date.now() + 15_000;
    while (connectedCount === 0 && Date.now() < deadline) {
      await this.page.waitForTimeout(100);
    }

    // Short pause to let a potential disconnect fire
    await this.page.waitForTimeout(150);

    // If a disconnect was observed (React strict mode), wait for the reconnect
    if (sawDisconnect) {
      while (connectedCount < 2 && Date.now() < deadline) {
        await this.page.waitForTimeout(100);
      }
    }

    // Brief settle for sync message processing
    await this.page.waitForTimeout(200);

    this.page.off('console', handler);
  }

  /** Convert canvas-relative coordinates to page-absolute coordinates. */
  async toPageCoords(
    canvasX: number,
    canvasY: number,
  ): Promise<{ x: number; y: number }> {
    const box = await this.page.locator('canvas').boundingBox();
    if (!box) throw new Error('Canvas not found');
    return { x: box.x + canvasX, y: box.y + canvasY };
  }

  /** Draw a line by dragging from `from` to `to` (canvas-relative coords). */
  async drawLine(
    from: { x: number; y: number },
    to: { x: number; y: number },
    options?: { steps?: number },
  ): Promise<void> {
    const start = await this.toPageCoords(from.x, from.y);
    const end = await this.toPageCoords(to.x, to.y);

    await this.page.mouse.move(start.x, start.y);
    await this.page.mouse.down();
    await this.page.mouse.move(end.x, end.y, { steps: options?.steps ?? 5 });
    await this.page.mouse.up();
  }

  /** Select a drawing tool by its aria-label. */
  async selectTool(
    tool: 'pen' | 'eraser' | 'rectangle' | 'circle' | 'line' | 'text',
  ): Promise<void> {
    const labels: Record<string, string> = {
      pen: 'Select Pen tool',
      eraser: 'Select Eraser tool',
      rectangle: 'Select Rectangle tool',
      circle: 'Select Circle tool',
      line: 'Select Line tool',
      text: 'Select Text tool',
    };
    await this.page.getByLabel(labels[tool]).click();
  }

  /** Select a color by its title attribute (e.g. "Red", "Blue"). */
  async selectColor(colorName: string): Promise<void> {
    await this.page.locator(`button[title="${colorName}"]`).click();
  }

  /** Click the "Clear Canvas" button. */
  async clearCanvas(): Promise<void> {
    await this.page.getByText('Clear Canvas').click();
  }

  /** Click the Undo button. */
  async undo(): Promise<void> {
    await this.page.getByLabel('Undo').click();
  }

  /** Click the Redo button. */
  async redo(): Promise<void> {
    await this.page.getByLabel('Redo').click();
  }

  /**
   * Read the pixel color at canvas-relative (x, y).
   * Accounts for HiDPI by multiplying with devicePixelRatio.
   */
  async getPixelColor(
    x: number,
    y: number,
  ): Promise<{ r: number; g: number; b: number; a: number }> {
    return this.page.evaluate(
      ([px, py]) => {
        const canvas = document.querySelector('canvas')!;
        const ctx = canvas.getContext('2d')!;
        const dpr = window.devicePixelRatio || 1;
        const data = ctx.getImageData(
          Math.round(px * dpr),
          Math.round(py * dpr),
          1,
          1,
        ).data;
        return { r: data[0], g: data[1], b: data[2], a: data[3] };
      },
      [x, y] as const,
    );
  }

  /** Check whether the pixel at (x, y) is not white/transparent (i.e. something is drawn). */
  async isDrawnAt(x: number, y: number): Promise<boolean> {
    const { r, g, b, a } = await this.getPixelColor(x, y);
    // Consider drawn if not white (all 255) and opaque enough
    if (a < 10) return false;
    return !(r > 250 && g > 250 && b > 250);
  }
}
