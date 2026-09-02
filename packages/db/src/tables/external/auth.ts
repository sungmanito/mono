import {
  jsonb,
  pgSchema,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

/**
 * Supabase-owned `auth` schema. These tables are mirrored here purely so app
 * queries and foreign keys can reference them with types — this package never
 * creates or migrates them. `drizzle.config.ts` deliberately globs only
 * `src/tables/*.table.ts`, so nothing in `external/` reaches migration output.
 */
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

export const identities = authSchema.table('identities', {
  id: text('id').notNull(),
  provider: text('provider').notNull(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
  email: text('email').notNull(),
  lastSignInAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});
