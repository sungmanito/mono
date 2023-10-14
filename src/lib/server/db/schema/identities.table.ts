import { text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { authSchema, users } from './users.table';
import { relations } from 'drizzle-orm';

export const identities = authSchema.table(
  'identities',
  {
    id: text('id').notNull(),
    provider: text('provider').notNull(),
    userId: uuid('user_id').notNull().references(() => users.id),
    email: text('email').notNull(),
    lastSignInAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  }
);

export const identityToUser = relations(identities, ({ one }) => ({
  user: one(users, {
    fields: [identities.userId],
    references: [users.id],
  })
}));

export const userToIdentities = relations(users, ({ many }) => ({
  identities: many(identities),
}));
