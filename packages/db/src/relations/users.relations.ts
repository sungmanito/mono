import { relations } from 'drizzle-orm';
import { users, usersToHouseholds, payments, identities, households } from '../tables';

export const userRelations = relations(users, ({ many, one }) => ({
  households: many(usersToHouseholds),
  paymentsMade: many(payments),
  identities: many(identities),
}));

export const usersToHouseholdsRelations = relations(usersToHouseholds, ({ one }) => ({
  user: one(users, {
    fields: [usersToHouseholds.userId],
    references: [users.id],
  }),
  household: one(households, {
    fields: [usersToHouseholds.householdId],
    references: [households.id],
  }),
}));