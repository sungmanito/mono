import type { Config } from 'drizzle-kit';
import 'dotenv/config';

export default {
  schema: './src/tables/index.ts',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DB_URL!,
  },
} satisfies Config;
