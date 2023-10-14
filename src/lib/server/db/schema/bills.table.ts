import { integer, pgTable, text } from "drizzle-orm/pg-core";
import { households } from "./households.table";
import { ulid } from 'ulidx';
export const bills = pgTable(
  'bills',
  {
    // Think we're going to use ULID here.
    id: text('id').primaryKey().$defaultFn(() => ulid()),
    billName: text('bill_name').notNull(),
    dueDate: integer('due_date').notNull().default(16),
    householdId: text('household_id').notNull().references(() => households.id, { onDelete: 'cascade' }),
  },
);