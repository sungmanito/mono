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

test('User can create household through dialog', async ({ page }) => {
  await page.goto('/');
  await page.goto('/dashboard/household');
  await login(page);
  await page
    .locator('section')
    .filter({ hasText: /^Add$/ })
    .getByRole('button')
    .click();
  await expect(page.getByText('New household')).toBeVisible();
  await page.getByLabel('Household Name').fill('Household 1');
  await page.getByRole('dialog').getByRole('button', { name: 'Add' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(
    page.getByTestId('sidebar-household').getByText('Household 1'),
  ).toBeVisible();
});

test('User can view household details', async ({ page }) => {
  await page.goto('/');
  await page.goto('/dashboard/household');
  await login(page);

  await page.getByTestId('sidebar-household').getByText('Household 1').click();
  await expect(
    page.getByRole('heading', { name: 'Household 1' }),
  ).toBeInViewport();
});

test('User can edit', async ({ page }) => {
  await page.goto('/');
  await page.goto('/dashboard/household');
  await login(page);

  await page.getByTestId('sidebar-household').getByText('Household 1').click();

  await page.getByRole('button', { name: 'Edit' }).click();
  await page.getByLabel('Household Name').clear();
  await page.getByLabel('Household Name').fill('Edited Household 1');
  await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click();
  await expect(
    page.getByTestId('sidebar-household').getByText('Edited Household 1'),
  ).toBeVisible();
});

test('User can delete household', async ({ page }) => {
  await page.goto('/');
  await page.goto('/dashboard/household');
  await login(page);

  await page
    .getByTestId('sidebar-household')
    .getByText('Edited Household 1')
    .click();
  await page.getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('dialog').getByRole('textbox').fill('delete');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Delete' })
    .click();
  await expect(
    page.getByTestId('sidebar-household').getByText('Edited Household 1'),
  ).not.toBeVisible();
});
