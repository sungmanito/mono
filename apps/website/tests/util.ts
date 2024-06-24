import type { Page } from '@playwright/test';
export async function login(page: Page) {
  await page.getByLabel('Username').fill(process.env.TEST_USER);
  await page.getByLabel('Password').fill(process.env.TEST_PW);
  await page.getByText('Submit').click();
}
