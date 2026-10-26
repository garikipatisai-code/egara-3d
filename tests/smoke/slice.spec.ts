import { expect, test } from '@playwright/test';

test('boots to title and flies without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('GL Driver Message')) {
      errors.push(message.text());
    }
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('./');
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.getByRole('heading', { level: 2 })).toContainText('Egara 3D');

  await page.getByRole('button', { name: 'Fly' }).click();
  await page.keyboard.down('KeyW');
  await page.keyboard.down('Space');
  await page.waitForTimeout(8000);
  await page.keyboard.up('KeyW');
  await page.keyboard.up('Space');

  const score = await page.locator('.hud-stat').first().textContent();
  expect(score).toMatch(/Score \d+/);
  expect(errors).toEqual([]);
});

test('mouse drag looks around and wheel zooms without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('./');
  await page.getByRole('button', { name: 'Fly' }).click();

  await page.mouse.move(480, 270);
  await page.mouse.down();
  await page.mouse.move(680, 200, { steps: 10 });
  await page.mouse.up();
  await page.mouse.wheel(0, 240);
  await page.mouse.wheel(0, -120);
  await page.waitForTimeout(1500);

  await expect(page.locator('canvas')).toBeVisible();
  expect(errors).toEqual([]);
});
