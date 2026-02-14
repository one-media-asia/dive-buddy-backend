import { test, expect } from '@playwright/test';

test('app root redirects to auth and shows Sign In', async ({ page }) => {
  const base = process.env.PREVIEW_URL ?? 'http://localhost:8080';
  await page.goto(base);
  // Wait for the auth page header to appear
  await expect(page.locator('h2')).toHaveText('Sign In');
});
