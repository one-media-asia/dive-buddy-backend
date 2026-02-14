import { test, expect } from '@playwright/test';

test('example domain loads in browser', async ({ page }) => {
  await page.goto('https://example.com');
  await expect(page).toHaveTitle(/Example Domain/);
});
