import { setupServer } from 'msw/node';
import { http, passthrough } from 'msw';
import type { FullConfig } from '@playwright/test';
export const server = setupServer();
export default async function globalSetup(config: FullConfig) {
  server.use(
    http.all('*', async ({ request }) => {
      console.info('hi jim!', request);
      // return passthrough();
    }),
  );
  server.listen();
}
