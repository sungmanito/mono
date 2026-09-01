import { expect, test, type Page } from '@playwright/test';
import { login } from './util';

async function checkBasics(page: Page) {
  await expect(
    page.getByRole('heading', { name: 'Sungmanito', exact: true }),
  ).toBeVisible();
  await expect(
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

// The rest of the suite reuses a stored session (see tests/auth.setup.ts); this
// is the one spec that drives the real login form, so it opts out of that
// storage state and starts logged out.
test.describe('login form', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('Login', async ({ page }) => {
    await page.goto('/');
    await page.getByText('Login').click();
    await login(page);
    await page.waitForURL(/dashboard/);
    await expect(
      page.getByRole('heading', { name: 'Dashboard', exact: false }),
    ).toBeInViewport();
  });
});
