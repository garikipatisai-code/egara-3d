import { expect, test } from '@playwright/test';

const liveUrl = process.env.LIVE_URL;

test.skip(!liveUrl, 'set LIVE_URL to smoke-test the deployed site');

test('deployed site responds and boots', async ({ page }) => {
  const response = await page.goto(liveUrl!);
  expect(response?.status()).toBeLessThan(400);
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.getByRole('heading', { level: 2 })).toContainText('Egara 3D');
});
