import { jsonb, pgSchema, uuid, varchar } from 'drizzle-orm/pg-core';

export const authSchema = pgSchema('auth');

export const users = authSchema.table('users', {
  id: uuid('id').notNull().primaryKey(),
  email: varchar('email').notNull(),
  userMetadata: jsonb('raw_user_meta_data').$type<{
    name: string;
    email: string;
    picture: string;
    avatar_url: string;
  }>(),
});

export type UserSqlType = typeof users.$inferSelect;
