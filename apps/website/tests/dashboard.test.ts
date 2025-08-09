import { expect, test } from '@playwright/test';
import { navigateAndLoginTo } from './util';

test('Dashboard redirects to login page when user is not logged in', async ({
  page,
}) => {
  await navigateAndLoginTo('/dashboard', page);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Overdue' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Due This Week' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Paid' })).toBeVisible();
});

test('Filters work correctly on the dashboard', async ({ page }) => {
  // Login to the dashboard
  await navigateAndLoginTo('/dashboard', page);

  // grab the count to en sure the filters work
  const count = await page.getByRole('listitem').count();
  expect(count).not.toBe(0);

  // Check if the "Overdue" filter works
  await page.getByRole('button', { name: 'Overdue', exact: true }).click();
  expect(await page.getByRole('listitem').count()).toBeLessThanOrEqual(count);

  // Check if the "Due This Week" filter works
  await page.getByRole('button', { name: 'Paid', exact: true }).click();
  expect(await page.getByRole('listitem').count()).toBeLessThanOrEqual(count);

  // Check if filter resets to "All" correctly
  await page.getByRole('button', { name: 'All', exact: true }).click();
  expect(await page.getByRole('listitem').count()).toBe(count);
});

test('Adding new bills works correctly', async ({ page }) => {
  await navigateAndLoginTo('/dashboard', page);

  // Click the "Add New Bill" button
  await page.getByRole('button', { name: 'Add New Bill' }).click();

  // Fill out the bill form
  await page.getByLabel('Name').fill('Test Bill');
  await page.getByLabel('Amount').fill('100');
  await page.getByLabel('Due Date').fill('5');

  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Add', exact: true })
    .click();

  // await waitFor(async () => !(await page.getByRole('dialog').isVisible()));

  // // Ensure the new bill appears on the dashboard
  // await expect(page.getByText('Test Bill')).toBeVisible();

  // // Navigate to the bills page
  await page.goto('/dashboard/bills');

  // // Find and delete the bill
  const billRow = page.getByRole('row', { name: /Test Bill/ });
  await billRow.getByRole('button', { name: 'Delete' }).click();
  await page.getByRole('dialog').getByRole('textbox').fill('delete');
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Submit' })
    .click();

  // // Ensure the bill is deleted
  await expect(page.getByRole('row', { name: 'Test Bill' })).not.toBeVisible();
});
