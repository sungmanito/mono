import { pgSchema, text, uuid } from 'drizzle-orm/pg-core';
import { users } from './auth';

/**
 * Supabase-owned `storage` schema. Mirrored here only for FK/type references
 * (see the note in `./auth.ts`) — never created or migrated by this package.
 */
export const storageSchema = pgSchema('storage');

export const buckets = storageSchema.table('buckets', {
  id: text('id').notNull().primaryKey(),
});

export const objects = storageSchema.table('objects', {
  id: uuid('id').notNull().defaultRandom(),
  bucketId: text('bucket_id')
    .notNull()
    .references(() => buckets.id),
  name: text('name').notNull(),
  owner: uuid('owner').references(() => users.id),
  pathTokens: text('path_tokens').array(),
});
