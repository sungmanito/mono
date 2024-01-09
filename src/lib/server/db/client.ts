import { drizzle } from 'drizzle-orm/node-postgres';
import { DB_URL } from '$env/static/private';
import Pg from 'pg';
import * as schema from './schema';

const client = new Pg.Client({
  connectionString: DB_URL,
});

await client.connect();

export const db = drizzle(client, { schema, logger: true });
