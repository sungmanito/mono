import { relations } from 'drizzle-orm';
import { invites, users, households } from '../tables';

export const invitesRelations = relations(invites, ({ one }) => ({
  invitee: one(users, {
    fields: [invites.toId],
    references: [users.id],
  }),
  inviter: one(users, {
    fields: [invites.fromId],
    references: [users.id],
  }),
  household: one(households, {
    fields: [invites.householdId],
    references: [households.id],
  }),
}));
