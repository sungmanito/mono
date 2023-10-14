import { relations } from "drizzle-orm";
import { pgTable, smallint, text, timestamp } from "drizzle-orm/pg-core";
import { bills } from "./bills.table";
import { ulid } from 'ulidx';

export const payments = pgTable(
  'payments',
  {
    id: text('id').primaryKey().$defaultFn(() => ulid()),
    billId: text('bill_id').notNull().references(() => bills.id, { onDelete: 'cascade'}),
    proof: text('proof'),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    updatedBy: text('updated_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    forMonth: smallint('for_month').notNull().default(1),
  }
);

export const paymentToBill = relations(payments, ({ one }) => ({
  bill: one(bills, {
    fields: [payments.billId],
    references: [bills.id]
  })
}));

export const billsToPayments = relations(bills, ({ many }) => ({
  payments: many(payments)
}));
