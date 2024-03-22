import { text, pgSchema } from 'drizzle-orm/pg-core';

export const storageSchema = pgSchema('storage');

export const buckets = storageSchema.table('buckets', {
  id: text('id').notNull().primaryKey(),
});
