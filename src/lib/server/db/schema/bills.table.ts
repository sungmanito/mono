import { integer, pgTable, text } from "drizzle-orm/pg-core";

export const bills = pgTable(
  'bills',
  {
    // Think we're going to use ULID here.
    id: text('id').primaryKey(),
    billName: text('bill_name').notNull(),
    dueDate: integer('due_date').notNull().default(16),
    householdId: text('household_id').notNull()
  },
);