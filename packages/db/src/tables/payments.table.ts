import { sql } from 'drizzle-orm';
import {
  date,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  numeric,
} from 'drizzle-orm/pg-core';
import { bills } from './bills.table';
import { households } from './households.table';
import { objects } from './objects.table';
import { index } from 'drizzle-orm/pg-core';
import { users } from '.';

export const payments = pgTable(
  'payments',
  {
    id: text('id')
      .primaryKey()
      .default(sql`generate_ulid()`),
    billId: text('bill_id')
      .notNull()
      .references(() => bills.id, { onDelete: 'cascade' }),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    updatedBy: uuid('updated_by').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    forMonthD: date('for_month_d', { mode: 'date' }).notNull(),
    notes: text('notes'),
    proofImage: uuid('proof_image_id').references(() => objects.id, {
      onDelete: 'set null',
      onUpdate: 'cascade',
    }),
    amount: numeric('amount', { scale: 6, precision: 12 }),
    householdId: text('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'no action' }),
  },
  ({ billId, forMonthD, proofImage, householdId }) => ({
    billIdMonth: uniqueIndex('billId_month').on(billId, forMonthD),
    monthIndex: index('month_idx').on(forMonthD),
    proofImageIndex: uniqueIndex('proof_image_idx').on(proofImage),
    householdIndex: index('payment_household_idx').on(householdId),
  }),
);
