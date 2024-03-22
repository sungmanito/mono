import { pgTable, text, uuid, timestamp, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { households } from '.';

// I either need this, or i need to add information to the users_to_households table
export const invites = pgTable(
  'invites',
  {
    id: text('id')
      .primaryKey()
      .default(sql`generate_ulid()`),
    toEmail: text('to_email').notNull(),
    toId: uuid('to_id').notNull(),
    fromEmail: text('from_email').notNull(),
    fromId: uuid('from_id').notNull(),
    householdId: text('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    expiresAt: timestamp('expires_at')
      .notNull()
      .default(sql<string>`now() + interval '30 days'`),
  },
  ({ toId, fromId }) => ({
    toIdIdx: index('to_id_idx').on(toId),
    fromIdx: index('from_id_idx').on(fromId),
  }),
);
