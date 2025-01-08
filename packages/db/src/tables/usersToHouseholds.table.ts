import { pgTable, text, uuid, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './users.table';
import { households } from './households.table';

export const usersToHouseholds = pgTable(
  'users_to_households',
  {
    id: uuid('id').notNull().primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    householdId: text('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
  },
  ({ userId, householdId }) => ({
    userIdIndex: index('household_user_id_index').on(userId),
    householdIdx: index('household_household_id_index').on(householdId),
    userHouseholdIdx: uniqueIndex('user_id_household_id_index').on(
      userId,
      householdId,
    ),
  }),
);
