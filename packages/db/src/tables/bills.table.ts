import { sql } from 'drizzle-orm';
import {
  doublePrecision,
  index,
  integer,
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
    dueDate: integer('due_date').notNull().default(16),
    householdId: text('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    notes: text('notes'),
    amount: doublePrecision('amount').notNull().default(0),
    currency: text('currency').notNull().default('USD'),
  },
  ({ householdId }) => ({
    householdIndex: index('household_idx').on(householdId),
  }),
);
