import { test, expect } from '@playwright/test';

import { login } from './util';

test('Navigating and logging in redirection works', async ({ page }) => {
  await page.goto('/');
  await page.goto('/dashboard/household');
  await login(page);
  await expect(
    page.getByRole('heading', { name: 'Households', level: 1 }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Invites' })).toBeVisible();
  await expect(page.getByTestId('sidebar-household')).toBeVisible();
  expect(page.url()).toMatch('/dashboard/household');
});

test('User can create household', async ({ page }) => {
  await page.goto('/');
  await page.goto('/dashboard/household');
  await login(page);
  await page
    .locator('section')
    .filter({ hasText: /^Add$/ })
    .getByRole('button')
    .click();
  // await page.getByRole('button', { name: 'Add' }).click();
  await expect(page.getByText('New household')).toBeVisible();
});
