import { expect, test } from '@playwright/test';

/** With WebGL unavailable, the page must explain itself — never go blank. */
test('shows a readable message when WebGL is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    const proto = HTMLCanvasElement.prototype as unknown as Record<string, unknown>;
    proto.getContext = () => null;
  });

  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('./');
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.getByRole('heading', { level: 2 })).toContainText(/Egara 3D|WebGL/i, { timeout: 10000 });
  await expect(page.locator('body')).toContainText(/WebGL|browser/i);
});
