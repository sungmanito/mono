import { test, expect } from '@playwright/test';

import { login } from './util';

test('User can create bills', async ({ page }) => {
  await page.goto('/');
  await page.goto('/dashboard/bills');
  await login(page);

  await expect(page.getByRole('heading', { name: 'Bills' })).toBeVisible();

  await page.getByRole('button', { name: 'Add' }).click();
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
    await page
      .getByLabel('Due date')
      .nth(i)
      .fill((i + 1).toString());
  }

  await page.getByRole('dialog').getByRole('button', { name: 'Add' }).click();

  for (const billName of billsToMake) {
    await expect(page.getByText(billName)).toBeVisible();
  }
});

test('Users can view bill details and delete', async ({ page }) => {
  await page.goto('/');
  await page.goto('/dashboard/bills');

  await login(page);

  await page.getByTitle('Edit Bill New Bill 0').click();

  await page.getByLabel('Due Date').clear();
  await page.getByLabel('Due Date').fill('5');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(
    page
      .getByRole('row')
      .filter({ hasText: 'New Bill 0' })
      .getByRole('cell', { name: '5', exact: true }),
  ).toBeVisible();

  for (let i = 0; i < 5; i++) {
    await page.getByTitle(`Delete bill New Bill ${i}`).click();
    await page.getByRole('dialog').getByRole('textbox').fill('delete');

    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Submit' })
      .click();

    await expect(page.getByRole('dialog')).not.toBeVisible();
  }

  await expect(
    page.getByRole('cell').filter({ hasText: 'New Bill' }),
  ).not.toBeVisible();
});
