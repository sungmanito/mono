import { drizzle } from 'drizzle-orm/node-postgres';
import { env } from '$env/dynamic/private';
import Pg from 'pg';
import { exportedSchema } from '@sungmanito/db';

const client = new Pg.Pool({
  connectionString: env.DB_URL,
});

if (env.DB_URL) {
  await client.connect();
}

export const db = drizzle(client, {
  logger: true,
  schema: exportedSchema,
});