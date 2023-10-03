import { pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { users } from './users.table';
import { relations } from 'drizzle-orm';
import { households } from './households.table';

export const usersToHouseholds = pgTable(
  'users_to_households',
  {
    userId: uuid('user_id').notNull(),
    householdId: text('household_id').notNull(),
  }
);

export const usersToHouseholdsRelations = relations(usersToHouseholds, ({ one }) => ({
  user: one(users, {
    fields: [usersToHouseholds.userId],
    references: [users.id]
  }),
  households: one(households, {
    fields: [usersToHouseholds.householdId],
    references: [households.id]
  })
}));
