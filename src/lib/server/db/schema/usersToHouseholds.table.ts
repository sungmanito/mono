import { pgTable, text, uuid, index } from 'drizzle-orm/pg-core';
import { users } from './users.table';
import { relations } from 'drizzle-orm';
import { households } from './households.table';

export const usersToHouseholds = pgTable(
  'users_to_households',
  {
    id: uuid('id').notNull().primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    householdId: text('household_id').notNull().references(() => households.id, { onDelete: 'cascade' }),
  },
  ({ userId }) => ({
    userIdIndex: index('household_user_id_index').on(userId)
  })
);

export const usersToHouseholdsRelations = relations(usersToHouseholds, ({ one }) => ({
  user: one(users, {
    fields: [usersToHouseholds.userId],
    references: [users.id],
  }),
  household: one(households, {
    fields: [usersToHouseholds.householdId],
    references: [households.id],
  })
}));

export const usersHouseholds = relations(users, ({ many }) => ({
  households: many(usersToHouseholds)
}));

export const householdUsers = relations(households, ({ many }) => ({
  users: many(usersToHouseholds)
}));
