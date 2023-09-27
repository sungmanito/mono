import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { DB_URL } from '$env/static/private';
import { pgTable, text, date, integer } from 'drizzle-orm/pg-core';

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

export const db = drizzle(client);