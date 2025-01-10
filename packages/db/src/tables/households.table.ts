import { sql } from 'drizzle-orm';
import { date, index, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { users } from './users.table';

export const households = pgTable(
  'households',
  {
    id: text('id')
      .primaryKey()
      .default(sql`generate_ulid()`),
    name: text('name').notNull(),
    createdAt: date('created_at').notNull().defaultNow(),
    ownerId: uuid('owner_id').references(() => users.id, {
      onDelete: 'set null',
    }),
  },
  // Creating an index on the name as we will search on it.
  ({ name, ownerId }) => ({
    name: index('name_index').on(name),
    ownerId: index('owner_id').on(ownerId),
  }),
);
