import type { PlaywrightTestConfig } from '@playwright/test';
import { devices } from '@playwright/test';
import 'dotenv/config';

const config: PlaywrightTestConfig = {
  webServer: !process.env.CI
    ? {
        command: 'pnpm preview',
        url: process.env.BASE_URL || 'http://localhost:4173',
        reuseExistingServer: true,
      }
    : undefined,
  testDir: 'tests',
  testMatch: /(.+\.)?(test|spec)\.ts/,
  projects: [{ name: 'chromium', use: devices['Desktop Chrome'] }],
  timeout: !process.env.CI ? 25_000 : 10_000,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:4173',
  },
};

export default config;
