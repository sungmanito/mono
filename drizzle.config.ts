import type { Config } from 'drizzle-kit';
import 'dotenv/config';

export default {
  schema: './src/lib/server/db/schema/index.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DB_URL,
  }
} satisfies Config;
