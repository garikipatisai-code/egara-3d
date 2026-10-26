import { expect, test } from '@playwright/test';

test('throttle moves the fly and releasing it hovers', async ({ page }) => {
  test.setTimeout(45_000);
  await page.goto('./');
  await page.getByRole('button', { name: 'Start' }).click();
  await page.getByRole('button', { name: 'Fly', exact: true }).click();
  await expect(page.locator('.hud-bar')).toBeVisible();
  await page.bringToFront();
  await page.locator('canvas').click({ position: { x: 20, y: 20 } });

  await page.keyboard.down('KeyW');
  await page.waitForTimeout(800);
  const moving = Number(await page.locator('canvas').getAttribute('data-speed'));
  expect(moving).toBeGreaterThan(5);
  await page.keyboard.up('KeyW');

  await page.waitForTimeout(1000);
  const hovering = Number(await page.locator('canvas').getAttribute('data-speed'));
  expect(Math.abs(hovering)).toBeLessThan(1.2);
  await expect(page.locator('canvas')).toHaveAttribute('data-perched', 'false');
});

test('descend, perch on the ground, and take off', async ({ page }) => {
  test.setTimeout(45_000);
  await page.goto('./');
  await page.getByRole('button', { name: 'Start' }).click();
  await page.getByRole('button', { name: 'Fly', exact: true }).click();
  await expect(page.locator('.hud-bar')).toBeVisible();
  await page.bringToFront();
  await page.locator('canvas').click({ position: { x: 20, y: 20 } });

  await page.keyboard.down('KeyQ');
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(300);
    const altitude = Number(await page.locator('canvas').getAttribute('data-altitude'));
    if (altitude <= 4.1) break;
  }
  await page.keyboard.up('KeyQ');
  await page.waitForTimeout(250);
  await page.keyboard.press('KeyF');
  await expect(page.locator('canvas')).toHaveAttribute('data-perched', 'true', { timeout: 3000 });

  await page.keyboard.down('KeyW');
  await page.waitForTimeout(400);
  await page.keyboard.up('KeyW');
  await expect(page.locator('canvas')).toHaveAttribute('data-perched', 'false', { timeout: 3000 });
});
