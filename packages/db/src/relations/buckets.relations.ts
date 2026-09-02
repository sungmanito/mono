import { relations } from 'drizzle-orm';
import { buckets, objects } from '../tables/external/storage';

export const bucketRelations = relations(buckets, ({ many }) => ({
  objects: many(objects),
}));
