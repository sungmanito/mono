import { sql } from 'drizzle-orm';
import {
  date,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { bills } from './bills.table';
import { households } from './households.table';

export const billReminders = pgTable(
  'bill_reminders',
  {
    id: text('id')
      .primaryKey()
      .default(sql`generate_ulid()`),
    billId: text('bill_id')
      .notNull()
      .references(() => bills.id, { onDelete: 'cascade' }),
    householdId: text('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    dueDate: date('due_date', { mode: 'date' }).notNull(),
    sentAt: timestamp('sent_at', { withTimezone: true }).notNull().defaultNow(),
  },
  ({ billId, dueDate, householdId }) => [
    uniqueIndex('bill_reminder_bill_due_date_idx').on(billId, dueDate),
    index('bill_reminder_household_idx').on(householdId),
  ],
);
