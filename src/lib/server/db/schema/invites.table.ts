
import { pgTable, text, uuid, timestamp } from 'drizzle-orm/pg-core';
import { sql } from "drizzle-orm";
import { ulid } from "ulidx";

// I don't think we need this.
export const invites = pgTable(
  'invites',
  {
    id: text('id').primaryKey().$defaultFn(() => ulid()),
    toEmail: text('to_email').notNull(),
    fromEmail: text('from_email').notNull(),
    fromId: uuid('from_id').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    expiresAt: timestamp('expires_at').notNull().$default(() => sql<string>`now() + interval '30 days'`),
  }
);
