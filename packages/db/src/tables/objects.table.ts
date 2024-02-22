import { uuid, text } from 'drizzle-orm/pg-core';
import { buckets, storageSchema } from './buckets.table';
import { users } from '.';

// export const storageSchema = pgSchema('storage');

export const objects = storageSchema.table('objects', {
  id: uuid('id').notNull().defaultRandom(),
  bucketId: text('bucket_id')
    .notNull()
    .references(() => buckets.id),
  name: text('name').notNull(),
  owner: uuid('owner').references(() => users.id),
  pathTokens: text('path_tokens').array(),
});
