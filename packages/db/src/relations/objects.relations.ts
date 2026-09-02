import { relations } from 'drizzle-orm';
import { buckets, objects } from '../tables/external/storage';
import { payments } from '../tables';

export const objectRelations = relations(objects, ({ many, one }) => ({
  payments: many(payments),
  bucket: one(buckets, {
    fields: [objects.bucketId],
    references: [buckets.id],
  }),
}));
