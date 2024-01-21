import { relations } from 'drizzle-orm';
import { bills, households, payments } from '../tables';

export const billsRelations = relations(bills, ({ one, many }) => ({
  household: one(households, {
    fields: [bills.householdId],
    references: [households.id]
  }),
  payments: many(payments),
}));
