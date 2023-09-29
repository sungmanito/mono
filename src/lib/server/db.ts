import { relations } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { DB_URL } from '$env/static/private';
import { pgTable, text, date, integer, pgSchema, uuid, varchar, index } from 'drizzle-orm/pg-core';

const client = postgres(DB_URL)

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
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').notNull(),
  householdId: text('household_id').notNull(),
}, ({ userId, householdId }) => {
  return {
    userIdIndex: index('users_households_user_index').on(userId),
    householdIdIndex: index('users_households_household_index').on(householdId),
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
)

export const householdUsers = relations(Households, ({ many }) => ({
  users: many(Users),
}))

export const userHouseHolds = relations

export const paymentRelations = relations(Payments, ({ one }) => ({
  bill: one(Bills, {
    fields: [Payments.billId],
    references: [Bills.id]
  })
}));

export const db = drizzle(client);