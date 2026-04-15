import { defineConfig, devices } from '@playwright/test';

/* eslint-disable */
export default defineConfig({
  testDir: './src',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: '../../dist/e2e-report', open: 'never' }],
  ],
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npx nx serve painel-gazeta',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
