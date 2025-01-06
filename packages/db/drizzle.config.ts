import type { Config } from 'drizzle-kit';
import 'dotenv/config';

export default {
  dialect: 'postgresql',
  schema: './src/tables/index.ts',
  out: './drizzle',
  schemaFilter: ['public'],
  dbCredentials: {
    url: process.env.DB_URL!,
  },
} satisfies Config;
