import { drizzle } from 'drizzle-orm/node-postgres';
import { DB_URL } from '$env/static/private';
import Pg from 'pg';
import { exportedSchema } from '@sungmanito/db';

const client = new Pg.Pool({
  connectionString: DB_URL,
});

await client.connect();

export const db = drizzle(client, { schema: exportedSchema, logger: true });
