import { test, expect } from '@playwright/test';

import { STORAGE_STATE } from '../playwright.config';
import { navigateAndLoginTo } from './util';

test('Household page renders for an authenticated user', async ({ page }) => {
  await navigateAndLoginTo('/dashboard/household', page);
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
    const context = await browser.newContext({ storageState: STORAGE_STATE });
    const page = await context.newPage();
    try {
      await page.goto('/dashboard/household');
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
      await context.close();
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

test('Household detail Unpaid/Paid filters reflect payment state', async ({
  page,
  request,
}) => {
  // Self-seed instead of assuming the Default household already has unpaid
  // current-month bills (it might not: payments.test.ts pays some, and
  // current-month payment rows only exist once a bill is created with a due
  // day >= today or the /actions cron has run). Create a uniquely-named bill
  // due on the 28th — the highest allowed day, so bill creation seeds a
  // current-month payment row on all but the last few days of the month — and
  // assert the filters against that bill specifically.
  const billName = `Detail Bill ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const openDefault = async () => {
    await page.goto('/dashboard/household');
    await page
      .getByTestId('sidebar-household')
      .getByText('Default', { exact: true })
      .click();
    await expect(page.getByRole('heading', { name: 'Default' })).toBeVisible();
  };

  const detailRow = () =>
    page
      .getByTestId('bill-list')
      .getByRole('listitem')
      .filter({ hasText: billName });

  let created = false;
  try {
    await openDefault();

    await page
      .getByRole('main')
      .getByRole('button', { name: 'Add', exact: true })
      .click();
    await expect(
      page
        .getByRole('dialog')
        .getByRole('heading', { name: 'Create new bill' }),
    ).toBeVisible();
    await page.getByLabel('Name').fill(billName);
    await page.getByLabel('Due date').fill('28');
    await page.getByRole('dialog').getByRole('button', { name: 'Add' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();
    created = true;

    // The household detail list inner-joins current-month payments, so the
    // new bill only shows once it has a current-month payment row.
    await openDefault();
    if ((await detailRow().count()) === 0) {
      // Fallback: the cron endpoint seeds payment rows for the month ~5 days out.
      await request.get('/actions');
      await openDefault();
    }
    if ((await detailRow().count()) === 0) {
      test.skip(
        true,
        `Could not seed a current-month payment row for "${billName}" via the UI ` +
          `(calendar day ${new Date().getUTCDate()}). Needs a test-only DB seed ` +
          `helper — tracked as a SUN-31 follow-up.`,
      );
    }

    await page.getByRole('button', { name: 'Unpaid' }).click();
    await expect(detailRow()).toBeVisible();

    await page.getByRole('button', { name: 'Paid', exact: true }).click();
    await expect(detailRow()).toHaveCount(0);
  } finally {
    if (created) {
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
  }
});
