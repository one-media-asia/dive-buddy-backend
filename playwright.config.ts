import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'playwright-tests',
  timeout: 30_000,
  expect: { timeout: 5000 },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
