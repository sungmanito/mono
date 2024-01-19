import { index, integer, pgTable, text } from 'drizzle-orm/pg-core';
import { households } from './households.table';
import { sql } from 'drizzle-orm';
import { relations } from 'drizzle-orm';

export const bills = pgTable(
  'bills',
  {
    // Think we're going to use ULID here.
    id: text('id')
      .primaryKey()
      .default(sql`generate_ulid()`),
    billName: text('bill_name').notNull(),
    dueDate: integer('due_date').notNull().default(16),
    householdId: text('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    notes: text('notes'),
  },
  ({ householdId }) => ({
    householdIndex: index('household_idx').on(householdId),
  }),
);

export const billToHousehold = relations(bills, ({ one }) => ({
  household: one(households, {
    fields: [bills.householdId],
    references: [households.id],
  }),
}));
