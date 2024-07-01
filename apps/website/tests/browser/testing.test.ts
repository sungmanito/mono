import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('/login');
  await expect(page).toHaveTitle('Sungmanito - Login');
});
