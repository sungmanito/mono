import type { PlaywrightTestConfig } from '@playwright/test';
import 'dotenv/config';

const config: PlaywrightTestConfig = {
  webServer: !process.env.CI
    ? {
        command: 'npm run preview',
        baseURL: process.env.BASE_URL || 'http://localhost:4173',
      }
    : undefined,
  testDir: 'tests',
  testMatch: /(.+\.)?(test|spec)\.[jt]s/,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:4173',
    trace: 'retain-on-failure',
  },
};

export default config;
