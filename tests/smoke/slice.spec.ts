import { expect, test } from '@playwright/test';

test('boots to title, briefs chapter one, and flies without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('GL Driver Message')) {
      errors.push(message.text());
    }
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('./');
  await expect(page.locator('canvas')).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Egara 3D');

  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.getByRole('heading', { level: 2 })).toContainText('First Flight');
  await expect(page.getByText('Reach the balcony')).toBeVisible();

  await page.getByRole('button', { name: 'Fly', exact: true }).click();
  await expect(page.locator('.hud-objective')).toContainText('Objective');
  await expect(page.locator('.hud-chip').first()).toContainText('Memories 0/4');

  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(900);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.down('Space');
  await page.waitForTimeout(500);
  await page.keyboard.up('Space');

  expect(errors).toEqual([]);
});

test('mouse drag looks around and wheel zooms without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('./');
  await page.getByRole('button', { name: 'Start' }).click();
  await page.getByRole('button', { name: 'Fly', exact: true }).click();

  await page.mouse.move(480, 270);
  await page.mouse.down();
  await page.mouse.move(680, 200, { steps: 10 });
  await page.mouse.up();
  await page.mouse.wheel(0, 240);
  await page.mouse.wheel(0, -120);
  await page.waitForTimeout(1200);

  await expect(page.locator('canvas')).toBeVisible();
  expect(errors).toEqual([]);
});
