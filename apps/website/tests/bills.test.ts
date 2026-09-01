import { test, expect } from '@playwright/test';

import { STORAGE_STATE } from '../playwright.config';
import { navigateAndLoginTo } from './util';

// These four steps share the same `New Bill 0..4` rows (create → edit →
// delete-one → delete-rest), so they can only run as an ordered unit.
// describe.serial makes that explicit and stops a mid-sequence failure from
// cascading into unrelated-looking failures. The afterAll sweeps up any rows a
// failed step left behind so the next run still starts clean.
test.describe.serial('bill creation lifecycle', () => {
  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext({ storageState: STORAGE_STATE });
    const page = await context.newPage();
    const leftovers = page.getByRole('listitem', {
      name: /(New Bill \d+|Renamed Bill)/,
    });
    let sweepError: unknown;
    let remaining = -1;
    try {
      await page.goto('/dashboard/bills');
      await expect(
        page.getByRole('heading', { name: 'Bills & Payments' }),
      ).toBeVisible();
      // Deleting re-renders the list, so re-query `.first()` each iteration.
      // Each attempt is isolated so one stuck row doesn't abort the sweep.
      for (
        let guard = 0;
        guard < 20 && (await leftovers.count()) > 0;
        guard++
      ) {
        try {
          await leftovers
            .first()
            .getByRole('button', { name: 'Delete' })
            .click();
          await page
            .getByRole('dialog')
            .getByRole('button', { name: 'Delete' })
            .click();
        } catch (e) {
          sweepError = e;
        }
        await page.waitForTimeout(250);
      }
      remaining = await leftovers.count();
    } catch (e) {
      sweepError ??= e;
    } finally {
      await context.close();
    }

    // Leftover `New Bill`/`Renamed Bill` rows live in shared data where a later
    // run's strict locators would match duplicates, so a sweep that can't
    // finish must fail the run rather than pass silently.
    if (remaining !== 0) {
      throw new Error(
        `bill cleanup did not finish: ${
          remaining < 0
            ? 'could not verify remaining rows'
            : `${remaining} test bill row(s) left behind`
        }`,
        { cause: sweepError },
      );
    }
  });

  test('User can create bills', async ({ page }) => {
    await navigateAndLoginTo('/dashboard/bills', page);

    await expect(
      page.getByRole('heading', { name: 'Bills & Payments' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'New Bill' }).click();
    await expect(
      page
        .getByRole('dialog')
        .getByRole('heading', { name: 'Create new bill' }),
    ).toBeVisible();

    // TODO: Add in more households and randomize the middle selector

    const billsToMake = Array.from({ length: 5 }, (_, i) => `New Bill ${i}`);

    for (let i = 0; i < billsToMake.length; i++) {
      await page.getByLabel('Name').nth(i).fill(billsToMake[i]);
      if (i !== billsToMake.length - 1)
        await page
          .getByRole('dialog')
          .getByRole('button', { name: 'New Bill' })
          .click();

      // Randomly select a household, as there should be two options to choose from
      await page
        .getByLabel('Household')
        .nth(i)
        .selectOption({ index: Math.ceil(Math.random() * 2) });
      await page
        .getByLabel('Due date')
        .nth(i)
        .fill((i + 1).toString());
    }

    await page.getByRole('dialog').getByRole('button', { name: 'Add' }).click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    for (const billName of billsToMake) {
      await expect(
        page.getByRole('link', { name: billName, exact: true }),
      ).toBeVisible();
    }
  });

  test('Users can edit bills', async ({ page }) => {
    await navigateAndLoginTo('/dashboard/bills', page);

    await expect(
      page
        .getByRole('listitem', { name: /New Bill \d+/, exact: false })
        .first(),
    ).toBeVisible();

    // Single edit: rename one bill via its row's Edit button, then clean it
    // back up so it doesn't throw off the delete tests' bill counts.
    await page
      .getByRole('listitem', { name: /New Bill \d+/, exact: false })
      .first()
      .getByRole('button', { name: 'Edit' })
      .click();

    await expect(
      page.getByRole('dialog').getByRole('heading', { name: 'Edit Bills' }),
    ).toBeVisible();

    await page.getByLabel('Bill name').fill('Renamed Bill');
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Save' })
      .click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    const renamedBill = page.getByRole('listitem', { name: 'Renamed Bill' });
    await expect(
      renamedBill.getByRole('link', { name: 'Renamed Bill' }),
    ).toBeVisible();

    await renamedBill.getByRole('button', { name: 'Delete' }).click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Delete' })
      .click();
    await expect(renamedBill).toHaveCount(0);

    // Bulk edit: select two bills and change their due dates together. The
    // list re-sorts by due date after saving, so track the two bills by name
    // rather than position.
    const bills = page.getByRole('listitem', {
      name: /New Bill \d+/,
      exact: false,
    });
    const firstBillName = await bills.nth(0).getAttribute('aria-label');
    const secondBillName = await bills.nth(1).getAttribute('aria-label');
    await bills.nth(0).getByRole('checkbox').check();
    await bills.nth(1).getByRole('checkbox').check();

    await page.getByRole('button', { name: 'Edit selected bills' }).click();

    await expect(
      page.getByRole('dialog').getByRole('heading', { name: 'Edit Bills' }),
    ).toBeVisible();
    await expect(page.getByLabel('Due date')).toHaveCount(2);

    // The edit form's bill order isn't guaranteed to match the order bills
    // were selected in, so scope each due-date fill to its own bill section.
    await page
      .getByRole('dialog')
      .locator('.variant-ghost-surface', { hasText: firstBillName! })
      .getByLabel('Due date')
      .fill('15');
    await page
      .getByRole('dialog')
      .locator('.variant-ghost-surface', { hasText: secondBillName! })
      .getByLabel('Due date')
      .fill('16');
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Save' })
      .click();
    await expect(page.getByRole('dialog')).not.toBeVisible();

    await expect(
      page.getByRole('listitem', { name: firstBillName! }),
    ).toContainText('15th');
    await expect(
      page.getByRole('listitem', { name: secondBillName! }),
    ).toContainText('16th');
  });

  test('Users can delete bills using dedicated delete button', async ({
    page,
  }) => {
    await navigateAndLoginTo('/dashboard/bills', page);

    await expect(
      page.getByRole('heading', { name: /New Bill \d/, exact: false }).first(),
    ).toBeVisible();

    await expect(
      page
        .getByRole('listitem', { name: /New Bill \d+/, exact: false })
        .first(),
    ).toBeVisible();

    const newBillCount = await page
      .getByRole('listitem', { name: /New Bill \d+/, exact: false })
      .count();

    console.info('New Bill Count', newBillCount);

    await page
      .getByRole('listitem', { name: /New Bill \d+/, exact: false })
      .first()
      .getByRole('button', { name: 'Delete' })
      .click();

    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Delete' })
      .click();

    await expect(
      page.getByRole('listitem', { name: /New Bill \d+/, exact: false }),
    ).toHaveCount(newBillCount - 1);
  });

  test('Users can delete bills using bulk actions', async ({ page }) => {
    await navigateAndLoginTo('/dashboard/bills', page);

    await expect(
      page.getByRole('heading', { name: /New Bill \d/, exact: false }).first(),
    ).toBeVisible();

    await expect(
      page
        .getByRole('listitem', { name: /New Bill \d+/, exact: false })
        .first(),
    ).toBeVisible();

    const newBillCount = await page
      .getByRole('listitem', { name: /New Bill \d+/, exact: false })
      .count();

    for (let n = 0; n < newBillCount; n++) {
      await page
        .getByRole('listitem', { name: /New Bill \d+/, exact: false })
        .nth(n)
        .getByRole('checkbox')
        .check();
    }

    // Click the delete button
    await page.getByRole('button', { name: 'Delete selected bills' }).click();

    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Delete' })
      .click();

    await expect(
      page
        .getByRole('listitem', { name: /New Bill \d+/, exact: false })
        .first(),
    ).not.toBeVisible();
  });
});
