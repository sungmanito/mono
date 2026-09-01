import type { PlaywrightTestConfig } from '@playwright/test';
import 'dotenv/config';

// Written once by the `setup` project (tests/auth.setup.ts) and reused by every
// other spec via `storageState`, so the login form is exercised exactly once
// per run instead of at the top of every test.
export const STORAGE_STATE = 'playwright/.auth/user.json';

const config: PlaywrightTestConfig = {
  webServer: !process.env.CI
    ? {
        command: 'npm run preview',
        url: process.env.BASE_URL || 'http://localhost:4173',
        reuseExistingServer: true,
      }
    : undefined,
  testDir: 'tests',
  testMatch: /(.+\.)?(test|spec)\.[jt]s/,
  // The suite mutates shared remote state; keep it single-file-at-a-time.
  workers: 1,
  // Stopgap for residual flake in CI only — locally, flakes should still fail
  // loudly so they get fixed rather than retried away.
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:4173',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    {
      name: 'chromium',
      dependencies: ['setup'],
      use: {
        storageState: STORAGE_STATE,
      },
    },
  ],
};

export default config;
