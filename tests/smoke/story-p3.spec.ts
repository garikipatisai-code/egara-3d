import { expect, test, type Page } from '@playwright/test';

async function seed(
  page: Page,
  done: string[],
  shards: string[] = [],
  amulet = false
): Promise<void> {
  await page.addInitScript(
    ({ ids, found, charm }: { ids: string[]; found: string[]; charm: boolean }) => {
      const chapters: Record<string, { done: boolean; bestTime: number; shards: string[]; deaths: number }> = {};
      for (const id of ids) chapters[id] = { done: true, bestTime: 90, shards: [], deaths: 0 };
      localStorage.setItem(
        'egara3d.save',
        JSON.stringify({ v: 2, muted: true, lang: 'en', best: 0, chapters, shards: found, amulet: charm })
      );
    },
    { ids: done, found: shards, charm: amulet }
  );
}

test('all eight chapters unlock after the Diviner', async ({ page }) => {
  await seed(page, ['ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6', 'ch7']);
  await page.goto('./');
  await page.getByRole('button', { name: 'Chapters' }).click();

  await expect(page.getByRole('button', { name: /The Glass House/ })).toBeEnabled();
  await expect(page.getByRole('button', { name: /The Cannon/ })).toBeEnabled();

  await page.getByRole('button', { name: /The Glass House/ }).click();
  await expect(page.getByRole('heading', { level: 2 })).toContainText('The Glass House');
  await page.getByRole('button', { name: 'Fly', exact: true }).click();
  await expect(page.locator('.hud-objective')).toContainText('Reach the vent');
  await expect(page.locator('.hud-boss')).toBeHidden();
});

test('Garva shows a four-node boss bar that clears on pause', async ({ page }) => {
  await seed(page, ['ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6', 'ch7']);
  await page.goto('./');
  await page.getByRole('button', { name: 'Chapters' }).click();
  await page.getByRole('button', { name: /The Cannon/ }).click();
  await page.getByRole('button', { name: 'Fly', exact: true }).click();

  await expect(page.locator('.hud-boss')).toBeVisible();
  await expect(page.locator('.hud-boss')).toContainText('Garva 0/4');

  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.locator('.hud-boss')).toBeHidden();
  await page.getByRole('button', { name: 'Resume' }).click();
  await expect(page.locator('.hud-boss')).toBeVisible();
});

test('the amulet badge shows and grants an extra life', async ({ page }) => {
  const shards = [
    's1-1', 's1-2', 's1-3', 's1-4',
    's2-1', 's2-2', 's2-3', 's2-4',
    's3-1', 's3-2', 's3-3', 's3-4'
  ];
  await seed(page, [], shards, true);
  await page.goto('./');
  await expect(page.getByText(/Amulet earned/)).toBeVisible();

  await page.getByRole('button', { name: 'Start' }).click();
  await page.getByRole('button', { name: 'Fly', exact: true }).click();
  await expect(page.locator('.hud-chip').nth(1)).toContainText('♥♥♥♥');
});
