import { expect, test, type Page } from '@playwright/test';
import { login } from './util';

async function checkBasics(page: Page) {
  await expect(
    page.getByRole('heading', { name: 'Sungmanito', exact: true }),
  ).toBeVisible();
  await expect(
    // eslint-disable-next-line quotes
    page.getByText("Don't just track your bills, hunt them.", { exact: false }),
  ).toBeInViewport();
}

test('Index has the proper text', async ({ page }) => {
  await page.goto('/');
  await checkBasics(page);
});

test('Listens to users color preferences', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await checkBasics(page);
  // DOWNSTREAM: add in accessibility checks to ensure main texts are readible in light/dark mode
});

test('Dark mode switches correctly', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Light Switch').click();
  await checkBasics(page);
});

test('Login', async ({ page }) => {
  await page.goto('/');
  await page.getByText('Login').click();
  await login(page);
  await page.waitForURL(/dashboard/);
  await expect(
    page.getByText(`${process.env.TEST_USER} Dashboard`),
  ).toBeInViewport();
});
