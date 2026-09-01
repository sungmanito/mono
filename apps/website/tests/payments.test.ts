import { test, expect, type Page } from '@playwright/test';
import { navigateAndLoginTo, dragAndDropFile } from './util';

function billRow(page: Page, billName: string) {
  return page.getByRole('listitem').filter({ hasText: billName });
}

/**
 * Marks a bill's current payment unpaid if it is currently paid. Used to put a
 * row into a known state at the start of a test and to reset it afterwards, so
 * no spec depends on another having run first.
 */
async function ensureUnpaid(page: Page, billName: string) {
  const row = billRow(page, billName);
  const unmark = row.getByRole('button', { name: 'Unmark as paid' });
  if ((await unmark.count()) > 0) {
    await unmark.click();
    await expect(
      row.getByRole('button', { name: 'Mark as paid' }),
    ).toBeVisible();
  }
}

async function markPaid(
  page: Page,
  billName: string,
  { withProof = false }: { withProof?: boolean } = {},
) {
  const row = billRow(page, billName);
  await row.getByRole('button', { name: 'Mark as paid' }).click();

  await expect(
    page.getByRole('dialog').getByRole('heading', { name: 'Add payment info' }),
  ).toBeVisible();

  await page.getByLabel('Amount paid', { exact: false }).fill('100');
  await page.getByLabel('Notes', { exact: false }).fill('Test notes');

  if (withProof) {
    await dragAndDropFile(
      page,
      'input[type=file]',
      './tests/upload-proof/fake-order-conf.png',
      'image/png',
    );
    await expect(
      page.getByAltText('Preview for', { exact: false }),
    ).toBeVisible();
  }

  await page.getByRole('button', { name: 'Save' }).click();

  await expect(row.getByText('Paid', { exact: false })).toBeVisible();
  await expect(
    row.getByRole('button', { name: 'Unmark as paid' }),
  ).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await navigateAndLoginTo('/dashboard/bills', page);
  await expect(
    page.getByRole('heading', { name: 'Bills & Payments' }),
  ).toBeVisible();
});

test.afterEach(async ({ page }) => {
  // Reset both rows to unpaid so each spec starts from the same state
  // regardless of run order (this used to be a separate "cleanup" test).
  await page.goto('/dashboard/bills');
  await expect(
    page.getByRole('heading', { name: 'Bills & Payments' }),
  ).toBeVisible();
  await ensureUnpaid(page, 'Credit Card');
  await ensureUnpaid(page, 'Student Loans');
});

test('User can mark payments as paid without proof', async ({ page }) => {
  await expect(
    page.getByRole('listitem').filter({ hasText: 'Credit Card' }),
  ).toBeVisible();

  await ensureUnpaid(page, 'Credit Card');
  await markPaid(page, 'Credit Card');
});

test('User can mark payments as paid with proof', async ({ page }) => {
  await expect(
    page.getByRole('listitem').filter({ hasText: 'Student Loans' }),
  ).toBeVisible();

  await ensureUnpaid(page, 'Student Loans');
  await markPaid(page, 'Student Loans', { withProof: true });
});

test('Can view payment details', async ({ page }) => {
  // Self-contained: put Credit Card into a paid state, then open its payment
  // details from the status pill (afterEach unmarks it again).
  await ensureUnpaid(page, 'Credit Card');
  await markPaid(page, 'Credit Card');

  await billRow(page, 'Credit Card')
    .getByRole('button', { name: 'View payment details' })
    .click();

  await expect(
    page
      .getByRole('dialog')
      .getByRole('heading', { name: 'Payment for', exact: false }),
  ).toBeVisible();

  await expect(page.getByText('Paid at:', { exact: false })).toBeVisible();
});
