import { relations } from 'drizzle-orm';
import { payments, users, bills, households } from '../tables';
import { objects } from '../tables/objects.table';

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
  proofRef: one(objects, {
    fields: [payments.proofImage],
    references: [objects.id],
  }),
}));
