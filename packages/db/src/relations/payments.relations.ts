import { relations } from 'drizzle-orm';
import { payments, users, bills, households } from '../tables';

export const paymentRelations = relations(payments, ({ one, many }) => ({
  bill: one(bills, {
    fields: [payments.billId],
    references: [bills.id],
  }),
  payee: one(users, {
    fields: [payments.updatedBy],
    references: [users.id],
  }),
  household: one(households, {
    fields: [payments.householdId],
    references: [households.id],
  }),
}));
