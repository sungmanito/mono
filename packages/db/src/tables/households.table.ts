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
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => users.id),
  },
  // Creating an index on the name as we will search on it.
  ({ name }) => ({
    name: index('name_index').on(name),
  }),
);
