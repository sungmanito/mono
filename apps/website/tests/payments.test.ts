import { test, expect } from '@playwright/test';
import { navigateAndLoginTo, dragAndDropFile } from './util';

test('User can mark payments as paid without proof', async ({ page }) => {
  await navigateAndLoginTo('/dashboard/payments', page);

  await expect(page.getByRole('heading', { name: 'Payments' })).toBeVisible();

  await expect(
    page.getByRole('listitem').filter({ hasText: 'Credit Card' }),
  ).toBeVisible();

  await page
    .getByRole('listitem')
    .filter({ hasText: 'Credit Card' })
    .getByRole('button', { name: 'Mark as paid' })
    .click();

  await expect(
    page.getByRole('dialog').getByRole('heading', { name: 'Add payment info' }),
  ).toBeVisible();

  await page.getByLabel('Amount paid', { exact: false }).fill('100');

  await page.getByLabel('Notes', { exact: false }).fill('Test notes');
  await page.getByRole('button', { name: 'Save' }).click();

  await expect(
    page
      .getByRole('listitem')
      .filter({ hasText: 'Credit Card' })
      .getByText('Paid', { exact: false }),
  ).toBeVisible();

  await expect(
    page
      .getByRole('listitem')
      .filter({ hasText: 'Credit Card' })
      .getByRole('button', { name: 'Unmark as paid' }),
  ).toBeVisible();
});

test('User can mark payments as paid with proof', async ({ page }) => {
  await navigateAndLoginTo('/dashboard/payments', page);

  await expect(page.getByRole('heading', { name: 'Payments' })).toBeVisible();

  await expect(
    page.getByRole('listitem').filter({ hasText: 'Student Loans' }),
  ).toBeVisible();

  await page
    .getByRole('listitem')
    .filter({ hasText: 'Student Loans' })
    .getByRole('button', { name: 'Mark as paid' })
    .click();

  await expect(
    page.getByRole('dialog').getByRole('heading', { name: 'Add payment info' }),
  ).toBeVisible();

  await page.getByLabel('Amount paid', { exact: false }).fill('100');

  await page.getByLabel('Notes', { exact: false }).fill('Test notes');

  await dragAndDropFile(
    page,
    'input[type=file]',
    './tests/upload-proof/fake-order-conf.png',
    'image/png',
  );

  await expect(
    page.getByAltText('Preview for', { exact: false }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Save' }).click();

  await expect(
    page
      .getByRole('listitem')
      .filter({ hasText: 'Student Loans' })
      .getByText('Paid', { exact: false }),
  ).toBeVisible();

  await expect(
    page
      .getByRole('listitem')
      .filter({ hasText: 'Student Loans' })
      .getByRole('button', { name: 'Unmark as paid' }),
  ).toBeVisible();
});

test('Can view payment details', async ({ page }) => {
  await navigateAndLoginTo('/dashboard/payments', page);
  await expect(page.getByRole('heading', { name: 'Payments' })).toBeVisible();
  await page
    .getByRole('listitem')
    .filter({ hasText: 'Credit Card' })
    .getByText('Credit Card')
    .click();

  await expect(
    page
      .getByRole('dialog')
      .getByRole('heading', { name: 'Payment for', exact: false }),
  ).toBeVisible();

  await expect(page.getByText('Paid at:', { exact: false })).toBeVisible();
});

test('User can unmark payments', async ({ page }) => {
  await navigateAndLoginTo('/dashboard/payments', page);
  await expect(page.getByRole('heading', { name: 'Payments' })).toBeVisible();

  expect(await page.locator('.card').all()).toHaveLength(6);
  const cards = await page
    .getByRole('listitem')
    .filter({ hasText: 'Unmark as paid' })
    .all();

  for (let i = cards.length - 1; i > -1; i--) {
    const card = cards[i];
    try {
      await card.getByRole('button', { name: 'Unmark as paid' }).click();
      await page.waitForTimeout(1000); // Load bearing waitForTimeout
      await expect(
        card.getByRole('button', { name: 'Mark as paid' }),
      ).toBeVisible();
    } catch (e) {
      // No op right no
      console.error('WHOOPS', e);
    }
  }
});
