import { relations } from 'drizzle-orm';
import { objects } from '../tables/objects.table';
import { buckets } from '../tables/buckets.table';

export const bucketRelations = relations(buckets, ({ many }) => ({
  objects: many(objects),
}));
