import { expect, test } from '@playwright/test';

test('graphics quality toggles and persists', async ({ page }) => {
  test.setTimeout(45_000);
  await page.addInitScript(() => {
    if (localStorage.getItem('egara3d.save')) return;
    localStorage.setItem(
      'egara3d.save',
      JSON.stringify({
        v: 2,
        muted: true,
        lang: 'en',
        quality: 'high',
        best: 0,
        chapters: {},
        shards: [],
        amulet: false
      })
    );
  });

  await page.goto('./');
  await page.getByRole('button', { name: 'Start' }).click();
  await page.getByRole('button', { name: 'Fly', exact: true }).click();
  await expect(page.locator('.hud-bar')).toBeVisible();
  await page.waitForTimeout(300);
  await page.keyboard.press('KeyP');
  await expect(page.getByRole('heading', { level: 2 })).toContainText('Paused');

  const graphics = page.getByRole('button', { name: /Graphics:/ });
  if (((await graphics.textContent()) ?? '').includes('High')) await graphics.click();
  await expect(page.getByRole('button', { name: /Graphics:/ })).toContainText('Low');

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('egara3d.save') ?? '{}').quality);
  expect(stored).toBe('low');

  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Egara 3D');
  const persisted = await page.evaluate(
    () => JSON.parse(localStorage.getItem('egara3d.save') ?? '{}').quality
  );
  expect(persisted).toBe('low');
});
