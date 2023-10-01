import { date, index, pgTable, text } from "drizzle-orm/pg-core";

export const households = pgTable(
  'households',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    createdAt: date('created_at').notNull().defaultNow()
  },
  // Creating an index on the name as we will search on it.
  ({ name }) => ({
    name: index('name_index').on(name)
  })
);
