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

test.describe.serial('Household create/edit/delete lifecycle', () => {
  // Unique per run so this lifecycle never collides with (or gets confused
  // by) households left behind by a previous run. describe.serial also
  // means a failure in one step skips the rest instead of cascading into
  // unrelated-looking failures downstream.
  const householdName = `Household ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const editedHouseholdName = `Edited ${householdName}`;

  test.afterAll(async ({ browser }) => {
    // Best-effort cleanup: whichever name variant is still around (create
    // succeeded but edit/delete didn't, or edit succeeded but delete
    // didn't) gets deleted so it doesn't linger for future runs.
    const page = await browser.newPage();
    try {
      await navigateAndLoginTo('/dashboard/household', page);
      for (const name of [editedHouseholdName, householdName]) {
        const item = page
          .getByTestId('sidebar-household')
          .getByText(name, { exact: true });
        if (await item.isVisible().catch(() => false)) {
          await item.click();
          await page.getByRole('button', { name: 'Delete' }).click();
          await page.getByRole('dialog').getByRole('textbox').fill('delete');
          await page
            .getByRole('dialog')
            .getByRole('button', { name: 'Delete', exact: true })
            .click();
          break;
        }
      }
    } catch {
      // Cleanup is best-effort; don't fail the run over it.
    } finally {
      await page.close();
    }
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
      .fill(householdName);
    await page.getByRole('dialog').getByRole('button', { name: 'Add' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(
      page.getByRole('complementary').getByText(householdName, { exact: true }),
    ).toBeVisible();
  });

  test('User can edit', async ({ page }) => {
    await navigateAndLoginTo('/dashboard/household', page);

    await page
      .getByRole('complementary')
      .getByText(householdName, { exact: true })
      .click();

    await page.getByRole('button', { name: 'Edit' }).click();
    await page.getByLabel('Household Name').clear();
    await page.getByLabel('Household Name').fill(editedHouseholdName);
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Save' })
      .click();
    await expect(
      page
        .getByTestId('sidebar-household')
        .getByText(editedHouseholdName, { exact: true }),
    ).toBeVisible();
  });

  test('User can delete household', async ({ page }) => {
    await navigateAndLoginTo('/dashboard/household', page);

    await page
      .getByTestId('sidebar-household')
      .getByText(editedHouseholdName, { exact: true })
      .click();
    await page.getByRole('button', { name: 'Delete' }).click();
    await page.getByRole('dialog').getByRole('textbox').fill('delete');
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Delete', exact: true })
      .click();
    await expect(
      page
        .getByTestId('sidebar-household')
        .getByText(editedHouseholdName, { exact: true }),
    ).not.toBeVisible();
  });
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
