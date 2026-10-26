import { expect, test, type Page } from '@playwright/test';

async function seed(page: Page, done: string[]): Promise<void> {
  await page.addInitScript((ids: string[]) => {
    const chapters: Record<string, { done: boolean; bestTime: number; shards: string[]; deaths: number }> = {};
    for (const id of ids) chapters[id] = { done: true, bestTime: 90, shards: [], deaths: 0 };
    localStorage.setItem(
      'egara3d.save',
      JSON.stringify({
        v: 2,
        muted: true,
        lang: 'en',
        best: 0,
        chapters,
        shards: [],
        amulet: false
      })
    );
  }, done);
}

test('chapter four unlocks after chapter three and has no memory counter', async ({ page }) => {
  await seed(page, ['ch1', 'ch2', 'ch3']);
  await page.goto('./');
  await page.getByRole('button', { name: 'Chapters' }).click();

  const airport = page.getByRole('button', { name: /The Airport Road/ });
  await expect(airport).toBeEnabled();
  await expect(page.getByRole('button', { name: /Haunt the House/ })).toBeDisabled();
  await expect(page.getByRole('button', { name: /The Diviner/ })).toBeDisabled();
  const text = (await airport.textContent()) ?? '';
  expect(text).not.toContain('Memories 0/0');

  await airport.click();
  await expect(page.getByRole('heading', { level: 2 })).toContainText('The Airport Road');
  await page.getByRole('button', { name: 'Fly', exact: true }).click();
  await expect(page.locator('.hud-objective')).toContainText('Stay with the car');
  await expect(page.locator('.hud-boss')).toBeHidden();
});

test('the Diviner boss bar appears, clears on pause, and returns on resume', async ({ page }) => {
  await seed(page, ['ch1', 'ch2', 'ch3', 'ch4', 'ch5']);
  await page.goto('./');
  await page.getByRole('button', { name: 'Chapters' }).click();
  await page.getByRole('button', { name: /The Diviner/ }).click();
  await page.getByRole('button', { name: 'Fly', exact: true }).click();

  await expect(page.locator('.hud-boss')).toBeVisible();
  await expect(page.locator('.hud-boss')).toContainText('The Diviner 0/3');

  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.locator('.hud-boss')).toBeHidden();
  await page.getByRole('button', { name: 'Resume' }).click();
  await expect(page.locator('.hud-boss')).toBeVisible();
});
