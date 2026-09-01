import { test as setup } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { STORAGE_STATE } from '../playwright.config';
import { performLogin } from './util';

// Runs once before every other project (see `dependencies: ['setup']` in
// playwright.config.ts). Logs in through the real form and persists the
// resulting Supabase session so the rest of the suite starts authenticated.
setup('authenticate', async ({ page }) => {
  await performLogin(page);
  await mkdir(dirname(STORAGE_STATE), { recursive: true });
  await page.context().storageState({ path: STORAGE_STATE });
});
