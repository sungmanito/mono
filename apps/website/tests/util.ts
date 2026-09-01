import { expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';

/**
 * Fills and submits the login form. Does not wait for the result — callers that
 * need the session established should use {@link performLogin}.
 */
export async function login(page: Page) {
  await page.getByLabel('Username').fill(process.env.TEST_USER || '');
  await page.getByLabel('Password').fill(process.env.TEST_PW || '');
  await page.getByText('Submit').click();
}

/**
 * Logs in via the real form and waits for the session to actually stick:
 * `?/saveLogin` sets the Supabase cookie server-side, `use:enhance` then races
 * `invalidateAll()` + `goto()`, and `hooks.server.ts` only sees the session on
 * the *next* request. `waitForURL` alone doesn't cover that window, so we also
 * assert a rendered post-login signal, and retry the whole dance once.
 */
export async function performLogin(page: Page) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await page.goto('/login');
      await login(page);
      await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
      await expect(
        page.getByRole('heading', { name: 'Dashboard' }),
      ).toBeVisible({ timeout: 30_000 });
      return;
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError;
}

/**
 * Navigates to a dashboard URL. Auth is provided by the shared `storageState`
 * (see playwright.config.ts + tests/auth.setup.ts), so this no longer logs in.
 * Kept as a helper so specs read the same as before.
 */
export async function navigateAndLoginTo(url: string, page: Page) {
  await page.goto(url);
}

/**
 * Selects the current calendar month in the `aria-label="Month"` selector on
 * /dashboard/bills. That selector defaults to the newest month with any payment
 * rows — often a future all-pending month — so month-relative assertions need
 * to pin it explicitly. No-ops if the current month isn't an option (e.g. the
 * `/actions` cron hasn't seeded it yet), leaving the default selection.
 */
export async function selectCurrentMonth(page: Page) {
  const label = new Date().toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  const select = page.getByLabel('Month');
  await expect(select).toBeVisible();
  const option = select.locator('option', { hasText: label });
  if ((await option.count()) > 0) {
    await select.selectOption({ label });
  }
}

// Content shamelessly stolen from https://github.com/microsoft/playwright/issues/10667#issuecomment-998397241
export async function dragAndDropFile(
  page: Page,
  selector: string,
  filePath: string,
  fileType: string,
) {
  const buffer = await readFile(filePath).then((b) => b.toString('base64'));

  // Create the DataTransfer and File
  const dataTransfer = await page.evaluateHandle(
    async (data) => {
      const dt = new DataTransfer();
      // Convert the buffer to a hex array
      const blob = await fetch(data.buffer).then((r) => r.blob());
      const file = new File([blob], data.fileName, {
        type: data.fileType,
      });
      dt.items.add(file);
      return dt;
    },
    {
      buffer: `data:application/octet-stream;base64,${buffer}`,
      fileName: basename(filePath),
      fileType,
    },
  );

  // Now dispatch
  await page.dispatchEvent(selector, 'drop', { dataTransfer });
}
