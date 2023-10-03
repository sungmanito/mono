import { pgSchema, uuid, varchar } from 'drizzle-orm/pg-core';

export const authSchema = pgSchema('auth');

export const users = authSchema.table('users', {
  id: uuid('id').notNull().primaryKey(),
  email: varchar('email').notNull(),
});
