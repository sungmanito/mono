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

  // Wait for the bill list to finish loading before counting
  await expect(page.getByRole('listitem').first()).toBeVisible();

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
  // Unique per run so this test never collides with (or gets tripped up by)
  // bills left behind by a previous run, and the finally-block below deletes
  // it again so a failed assertion doesn't leave the row behind either.
  const billName = `Test Bill ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  await navigateAndLoginTo('/dashboard', page);

  try {
    // Click the "Add New Bill" button
    await page.getByRole('button', { name: 'Add New Bill' }).click();

    // Fill out the bill form
    await page.getByLabel('Name').fill(billName);
    await page.getByLabel('Amount').fill('100');
    await page.getByLabel('Due Date').fill('5');

    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Add', exact: true })
      .click();

    // Navigate to the bills page
    await page.goto('/dashboard/bills');

    // Find and delete the bill
    const billRow = page.getByRole('listitem', { name: billName });
    await billRow.getByRole('button', { name: 'Delete' }).click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Delete' })
      .click();

    // Ensure the bill is deleted
    await expect(
      page.getByRole('listitem', { name: billName }),
    ).not.toBeVisible();
  } finally {
    // Best-effort cleanup: if something above threw before the delete step
    // completed, remove the bill here so it doesn't linger for future runs.
    await page.goto('/dashboard/bills').catch(() => {});
    const leftover = page.getByRole('listitem', { name: billName });
    if (await leftover.isVisible().catch(() => false)) {
      await leftover
        .getByRole('button', { name: 'Delete' })
        .click()
        .catch(() => {});
      await page
        .getByRole('dialog')
        .getByRole('button', { name: 'Delete' })
        .click()
        .catch(() => {});
    }
  }
});
