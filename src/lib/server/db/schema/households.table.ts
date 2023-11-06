import { relations } from "drizzle-orm";
import { date, index, pgTable, text } from "drizzle-orm/pg-core";
import { bills } from "./bills.table";
import { ulid } from 'ulidx';

export const households = pgTable(
  'households',
  {
    id: text('id').primaryKey().$defaultFn(() => ulid()),
    name: text('name').notNull(),
    createdAt: date('created_at').notNull().defaultNow(),
    // ownerId: text('owner_id').notNull(),
  },
  // Creating an index on the name as we will search on it.
  ({ name }) => ({
    name: index('name_index').on(name)
  })
);

export const billHouseholdRelations = relations(bills, ({ one }) => ({
  household: one(households, {
    fields: [bills.householdId],
    references: [households.id]
  }),
}));

export const householdsToBillsRelations = relations(households, ({ many }) => ({
  bills: many(bills),
}));
