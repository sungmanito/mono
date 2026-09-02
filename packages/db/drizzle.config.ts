import type { Config } from 'drizzle-kit';
import 'dotenv/config';

export default {
  dialect: 'postgresql',
  // Only app-owned tables. The Supabase-owned `auth`/`storage` mirrors live in
  // `src/tables/external/` and are intentionally excluded from migrations.
  schema: './src/tables/*.table.ts',
  out: './drizzle',
  schemaFilter: ['public'],
  dbCredentials: {
    url: process.env.DB_URL!,
  },
} satisfies Config;
