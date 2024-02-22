import { relations } from 'drizzle-orm';
import { objects } from '../tables/objects.table';
import { payments } from '../tables';
import { buckets } from '../tables/buckets.table';

export const objectRelations = relations(objects, ({ many, one }) => ({
  payments: many(payments),
  bucket: one(buckets, {
    fields: [objects.bucketId],
    references: [buckets.id],
  }),
}));
