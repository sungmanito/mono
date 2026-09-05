import { sql } from 'drizzle-orm';
import {
  check,
  date,
  doublePrecision,
  index,
  integer,
  interval,
  pgTable,
  text,
} from 'drizzle-orm/pg-core';
import { households } from './households.table';

export const bills = pgTable(
  'bills',
  {
    id: text('id')
      .primaryKey()
      .default(sql`generate_ulid()`),
    billName: text('bill_name').notNull(),
    // Legacy day-of-month due date. Superseded by `recurrence` +
    // `anchorDate` (SUN-5/SUN-33); reads migrate off it in SUN-36/37/38,
    // and it's dropped in a contract migration by SUN-39.
    dueDate: integer('due_date').notNull().default(16),
    // "Every N days/weeks/months/years" from `anchorDate`, stored as a
    // Postgres interval (`1 mon`, `7 days`, `3 mons`, ...). Monthly is just
    // this column's default - never a code branch. ISO-8601 duration string
    // (`P1M`) <-> interval mapping lives in
    // apps/website/src/lib/util/recurrence.ts (`toPostgresInterval`).
    recurrence: interval('recurrence').notNull().default('1 mon'),
    // The first occurrence date. Later occurrences are
    // `anchorDate + k * recurrence` (see the SUN-35 `generate_due_payments`
    // projection). Day-of-month is capped at 28 by the check below.
    anchorDate: date('anchor_date', { mode: 'date' }).notNull(),
    householdId: text('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    notes: text('notes'),
    amount: doublePrecision('amount').notNull().default(0),
    currency: text('currency').notNull().default('USD'),
  },
  ({ householdId, anchorDate }) => [
    index('household_idx').on(householdId),
    // Applies to every cadence, not just monthly - harmless for weekly/daily,
    // and keeps monthly+ cadences off the ambiguous 29th-31st.
    check(
      'bills_anchor_day_chk',
      sql`extract(day from ${anchorDate}) between 1 and 28`,
    ),
  ],
);
