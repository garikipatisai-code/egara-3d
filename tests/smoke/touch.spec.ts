import { expect, test } from '@playwright/test';

test.describe('touch controls', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test('shows the stick and buttons and accepts touch input', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto('./');
    await page.getByRole('button', { name: 'Start' }).click();
    await page.getByRole('button', { name: 'Fly', exact: true }).click();

    await expect(page.locator('.hud-touch-sting')).toBeVisible();
    await expect(page.locator('.hud-touch-boost')).toBeVisible();
    await expect(page.locator('.hud-touch-up')).toBeVisible();
    await expect(page.locator('.hud-touch-down')).toBeVisible();
    await expect(page.locator('.hud-touch-perch')).toBeVisible();

    const canvas = page.locator('canvas');
    await canvas.dispatchEvent('pointerdown', {
      pointerType: 'touch',
      pointerId: 1,
      clientX: 80,
      clientY: 420,
      bubbles: true
    });
    await expect(page.locator('.hud-stick')).toHaveClass(/is-active/);
    await canvas.dispatchEvent('pointermove', {
      pointerType: 'touch',
      pointerId: 1,
      clientX: 110,
      clientY: 380,
      bubbles: true
    });
    await canvas.dispatchEvent('pointerup', {
      pointerType: 'touch',
      pointerId: 1,
      clientX: 110,
      clientY: 380,
      bubbles: true
    });
    await expect(page.locator('.hud-stick')).not.toHaveClass(/is-active/);

    await page.locator('.hud-touch-sting').dispatchEvent('pointerdown', {
      pointerType: 'touch',
      pointerId: 2,
      bubbles: true
    });
    await page.locator('.hud-touch-sting').dispatchEvent('pointerup', {
      pointerType: 'touch',
      pointerId: 2,
      bubbles: true
    });
    await page.locator('.hud-touch-boost').dispatchEvent('pointerdown', {
      pointerType: 'touch',
      pointerId: 3,
      bubbles: true
    });
    await page.locator('.hud-touch-boost').dispatchEvent('pointerup', {
      pointerType: 'touch',
      pointerId: 3,
      bubbles: true
    });

    await expect(page.locator('.hud-objective')).toContainText('Objective');
    expect(errors).toEqual([]);
  });
});
