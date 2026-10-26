import { defineConfig, devices } from '@playwright/test';

const origin = 'http://127.0.0.1:8080';
const basePath = '/egara-3d/';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `${origin}${basePath}`,
    trace: 'retain-on-failure'
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && npm run preview -- --host 127.0.0.1',
    url: `${origin}${basePath}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
