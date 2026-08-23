import { relations } from 'drizzle-orm';
import { billReminders, bills, households } from '../tables';

export const billRemindersRelations = relations(billReminders, ({ one }) => ({
  bill: one(bills, {
    fields: [billReminders.billId],
    references: [bills.id],
  }),
  household: one(households, {
    fields: [billReminders.householdId],
    references: [households.id],
  }),
}));
