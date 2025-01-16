import { pgTable, text, uuid, timestamp, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { households, users } from '.';

// I either need this, or i need to add information to the users_to_households table
export const invites = pgTable(
  'invites',
  {
    id: text('id')
      .primaryKey()
      .default(sql`generate_ulid()`),
    toEmail: text('to_email').notNull(),
    toId: uuid('to_id')
      .notNull()
      .references(() => users.id),
    fromEmail: text('from_email').notNull(),
    fromId: uuid('from_id')
      .notNull()
      .references(() => users.id),
    householdId: text('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    expiresAt: timestamp('expires_at')
      .notNull()
      .default(sql<string>`now() + interval '30 days'`),
  },
  ({ toId, fromId, householdId }) => ({
    toIdIdx: index('to_id_idx').on(toId),
    fromIdx: index('from_id_idx').on(fromId),
    householdId: index('invites_household_idx').on(householdId),
  }),
);
