import { relations } from 'drizzle-orm';
import { pgTable, text, date, integer, pgSchema, uuid, varchar, primaryKey } from 'drizzle-orm/pg-core';

export const Bills = pgTable(
  'bills',
  {
    // Think we're going to use ULID here.
    id: text('id').primaryKey(),
    billName: text('bill_name').notNull(),
    dueDate: integer('due_date').notNull().default(16),
    householdId: integer('household_id').notNull()
  },
);

export const Households = pgTable(
  'households',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
  }
);

export const usersToHouseholds = pgTable('users_to_households', {
  userId: uuid('user_id').notNull(),
  householdId: text('household_id').notNull(),
}, ({ userId, householdId }) => {
  return {
    usersToHouseholds: primaryKey(userId, householdId),
  }
});

export const usersToHouseholdsRelations = relations(usersToHouseholds, ({ one }) => ({
  user: one(Users, {
    fields: [usersToHouseholds.userId],
    references: [Users.id]
  }),
  houseHhold: one(Households, {
    fields: [usersToHouseholds.householdId],
    references: [Households.id]
  })
}));

export const Payments = pgTable(
  'payments',
  {
    id: text('id').primaryKey(),
    billId: text('id').notNull(),
    proof: text('proof'),
    paidAt: date('paid_at').notNull(),
    createdAt: date('created_at').notNull().defaultNow(),
  }
);

const authSchema = pgSchema('auth');

export const Users = authSchema.table(
  'users',
  {
    id: uuid('id').primaryKey(),
    email: varchar('email')
  },
);

export const householdUsers = relations(Households, ({ many }) => ({
  users: many(usersToHouseholds),
}))

export const paymentRelations = relations(Payments, ({ one }) => ({
  bill: one(Bills, {
    fields: [Payments.billId],
    references: [Bills.id]
  })
}));
