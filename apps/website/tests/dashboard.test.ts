import { expect, test } from '@playwright/test';
import { navigateAndLoginTo } from './util';

test('Dashboard redirects to login page when user is not logged in', async ({
  page,
}) => {
  await navigateAndLoginTo('/dashboard', page);
  await expect(
    page.getByRole('heading', { name: `${process.env.TEST_USER} Dashboard` }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Past Due' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Upcoming' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Coming Soon' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Paid' })).toBeVisible();
});
