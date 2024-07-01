import { server } from './global-setup';
export default async function globalTeardown() {
  console.info('closing');
  server.close();
}
