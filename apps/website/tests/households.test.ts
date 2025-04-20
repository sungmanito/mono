import { test, expect } from '@playwright/test';

import { login, navigateAndLoginTo } from './util';

test('Navigating and logging in redirection works', async ({ page }) => {
  await page.goto('/');
  await page.goto('/dashboard/household');
  await login(page);
  await expect(
    page.getByRole('heading', { name: 'Households', level: 1 }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Invites' })).toBeVisible();
  await expect(page.getByRole('complementary')).toBeVisible();
  expect(page.url()).toMatch('/dashboard/household');
});

test('User can create household through dialog', async ({ page }) => {
  await navigateAndLoginTo('/dashboard/household', page);
  await page
    .locator('section')
    .filter({ hasText: 'Add household' })
    .getByRole('button')
    .click();
  await expect(
    page.getByRole('dialog').getByText('New household'),
  ).toBeVisible();
  await page
    .getByRole('textbox', { name: 'Household Name' })
    .fill('Household 1');
  await page.getByRole('dialog').getByRole('button', { name: 'Add' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(
    page.getByRole('complementary').getByText('Household 1'),
  ).toBeVisible();
});

test('User can view household details', async ({ page }) => {
  await navigateAndLoginTo('/dashboard/household', page);

  await page.getByRole('complementary').getByText('Default').click();
  await expect(page.getByRole('heading', { name: 'Default' })).toBeInViewport();
  await expect(
    page.getByRole('listitem').filter({ hasText: 'Phone' }),
  ).toBeInViewport();
  await expect(
    page.getByRole('listitem').filter({ hasText: 'Credit Card' }),
  ).toBeVisible();
  await expect(
    page.getByRole('listitem').filter({ hasText: 'Student Loans' }),
  ).toBeVisible();

  await page
    .getByRole('listitem')
    .getByRole('link')
    .filter({ hasText: 'Phone' })
    .click();

  await expect(
    page
      .getByRole('dialog')
      .getByRole('heading', { name: 'Phone', exact: false }),
  ).toBeInViewport();

  expect(page.url()).toMatch(/\/dashboard\/bills\/[A-Z0-9]+$/);
  await page.keyboard.press('Escape');
  expect(page.url()).toMatch(/\/dashboard\/household\/?$/);
});

test('User can edit', async ({ page }) => {
  await navigateAndLoginTo('/dashboard/household', page);
  // await page.goto('/');
  // await page.goto('/dashboard/household');
  // await login(page);

  await page.getByRole('complementary').getByText('Household 1').click();

  await page.getByRole('button', { name: 'Edit' }).click();
  await page.getByLabel('Household Name').clear();
  await page.getByLabel('Household Name').fill('Edited Household 1');
  await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click();
  await expect(
    page.getByTestId('sidebar-household').getByText('Edited Household 1'),
  ).toBeVisible();
});

test('User can delete household', async ({ page }) => {
  await navigateAndLoginTo('/dashboard/household', page);

  await page
    .getByTestId('sidebar-household')
    .getByText('Edited Household 1')
    .click();
  await page.getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('dialog').getByRole('textbox').fill('delete');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Close', exact: true })
    .click();
  await expect(
    page.getByTestId('sidebar-household').getByText('Edited Household 1'),
  ).not.toBeVisible();
});

test('User can view bill details', async ({ page }) => {
  await navigateAndLoginTo('/dashboard/household', page);
  await page.getByTestId('sidebar-household').getByText('Default').click();
  await expect(page.getByRole('button', { name: 'Unpaid' })).toBeVisible();
  await page.getByRole('button', { name: 'Unpaid' }).click();

  await expect(
    await page.getByTestId('bill-list').getByRole('listitem').count(),
  ).toBeGreaterThan(0);

  await page.getByRole('button', { name: 'Paid', exact: true }).click();
  await expect(
    await page.getByTestId('bill-list').getByRole('listitem').count(),
  ).toBeLessThan(3);
  await expect(page.getByText('No bills match this filter')).toBeVisible();
});
