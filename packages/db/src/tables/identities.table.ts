import { text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { authSchema, users } from './users.table';

export const identities = authSchema.table('identities', {
  id: text('id').notNull(),
  provider: text('provider').notNull(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  email: text('email').notNull(),
  lastSignInAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});
