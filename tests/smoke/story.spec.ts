import { expect, test } from '@playwright/test';

test('chapter select shows eight chapters and enforces the lock', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Chapters' }).click();

  await expect(page.locator('.hud-chapter')).toHaveCount(8);
  await expect(page.getByRole('button', { name: /First Flight/ })).toBeEnabled();
  await expect(page.getByRole('button', { name: /The Locket/ })).toBeDisabled();
  await expect(page.getByRole('button', { name: /The Workshop/ })).toBeDisabled();
  await expect(page.getByRole('button', { name: /The Cannon/ })).toBeDisabled();
});

test('pause, resume, and restart stay on the same chapter', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Start' }).click();
  await page.getByRole('button', { name: 'Fly', exact: true }).click();
  await expect(page.locator('.hud-bar')).toBeVisible();

  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.getByRole('heading', { level: 2 })).toContainText('Paused');

  await page.getByRole('button', { name: 'Resume' }).click();
  await expect(page.locator('.hud-objective')).toContainText('Objective');

  await page.getByRole('button', { name: 'Pause' }).click();
  await page.getByRole('button', { name: 'Restart' }).click();
  await expect(page.getByRole('heading', { level: 2 })).toContainText('First Flight');
});

test('language toggle persists across reload', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Egara 3D');

  await page.getByRole('button', { name: /Language: English/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('ఎగర 3D');
  await expect(page.getByRole('button', { name: /భాష/ })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('ఎగర 3D');
});
