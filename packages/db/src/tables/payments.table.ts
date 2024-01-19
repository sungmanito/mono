import { relations, sql } from 'drizzle-orm';
import {
  date,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { bills } from './bills.table';
import { households } from './households.table';

export const payments = pgTable(
  'payments',
  {
    id: text('id')
      .primaryKey()
      .default(sql`generate_ulid()`),
    billId: text('bill_id')
      .notNull()
      .references(() => bills.id, { onDelete: 'cascade' }),
    proof: text('proof'),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    updatedBy: uuid('updated_by'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
    forMonth: smallint('for_month').notNull().default(1),
    forMonthD: date('for_month_d', { mode: 'date' }).notNull(),
    notes: text('notes'),
    householdId: text('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'no action' }),
  },
  ({ billId, forMonth }) => ({
    billIdMonth: uniqueIndex('billId_month').on(billId, forMonth),
  }),
);

export const paymentToBill = relations(payments, ({ one }) => ({
  bill: one(bills, {
    fields: [payments.billId],
    references: [bills.id],
  }),
}));

export const billsToPayments = relations(bills, ({ many }) => ({
  payments: many(payments),
}));
