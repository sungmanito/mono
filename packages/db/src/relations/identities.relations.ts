import { relations } from 'drizzle-orm';
import { identities, users } from '../tables';

export const identitiesRelations = relations(identities, ({ one }) => ({
  user: one(users, {
    fields: [identities.userId],
    references: [users.id],
  }),
}));
