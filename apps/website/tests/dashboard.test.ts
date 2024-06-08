import { test, expect } from '@playwright/test';
import { login } from './util';

test('Dashboard redirects to login page when user is not logged in', async ({
  page,
}) => {
  await page.goto('/');
  await page.goto('/dashboard');
  expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();
  await login(page);
  await expect(
    page.getByRole('heading', { name: 'jimpburbridge@gmail.com Dashboard' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Past Due' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Upcoming' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Coming Soon' }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Paid' })).toBeVisible();
});
