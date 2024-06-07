import { relations } from 'drizzle-orm';
import {
  bills,
  users,
  households,
  usersToHouseholds,
  payments,
} from '../tables';

export const householdRelations = relations(households, ({ many, one }) => ({
  users: many(usersToHouseholds),
  bills: many(bills),
  owner: one(users, {
    fields: [households.ownerId],
    references: [users.id],
  }),
  payments: many(payments),
}));
