import { test, expect } from '@playwright/test';

import { navigateAndLoginTo } from './util';

test('User can create bills', async ({ page }) => {
  await navigateAndLoginTo('/dashboard/bills', page);

  await expect(page.getByRole('heading', { name: 'Bills' })).toBeVisible();

  await page.getByRole('button', { name: 'New Bill' }).click();
  await expect(
    page.getByRole('dialog').getByRole('heading', { name: 'Create new bill' }),
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
    await expect(page.getByText(billName)).toBeVisible();
  }
});

test.skip('Users can edit bills', async () => {});

test('Users can delete bills using dedicated delete button', async ({
  page,
}) => {
  await navigateAndLoginTo('/dashboard/bills', page);

  await expect(
    page.getByRole('heading', { name: /New Bill \d/, exact: false }).first(),
  ).toBeVisible();

  await expect(
    page.getByRole('listitem', { name: /New Bill \d+/, exact: false }).first(),
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

  expect(
    await page
      .getByRole('listitem', { name: /New Bill \d+/, exact: false })
      .count(),
  ).toBe(newBillCount - 1);
});

test('Users can delete bills using bulk actions', async ({ page }) => {
  await navigateAndLoginTo('/dashboard/bills', page);

  await expect(
    page.getByRole('heading', { name: /New Bill \d/, exact: false }).first(),
  ).toBeVisible();

  await expect(
    page.getByRole('listitem', { name: /New Bill \d+/, exact: false }).first(),
  ).toBeVisible();

  const newBillCount = await page
    .getByRole('listitem', { name: /New Bill \d+/, exact: false })
    .count();

  for (let n = 0; n < newBillCount; n++) {
    console;
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
    page.getByRole('listitem', { name: /New Bill \d+/, exact: false }).first(),
  ).not.toBeVisible();
});
