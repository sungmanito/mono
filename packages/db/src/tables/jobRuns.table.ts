import { sql } from 'drizzle-orm';
import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const jobRuns = pgTable('job_runs', {
  id: text('id')
    .primaryKey()
    .default(sql`generate_ulid()`),
  jobName: text('job_name').notNull(),
  ranAt: timestamp('ran_at', { withTimezone: true }).notNull().defaultNow(),
  created: integer('created').notNull().default(0),
  skipped: integer('skipped').notNull().default(0),
  durationMs: integer('duration_ms').notNull().default(0),
  error: text('error'),
});
