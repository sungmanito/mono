import { pgTable, uniqueIndex, index, foreignKey, text, timestamp, uuid, date, numeric, integer, doublePrecision } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const payments = pgTable("payments", {
	id: text().default(generate_ulid()).primaryKey().notNull(),
	billId: text("bill_id").notNull(),
	paidAt: timestamp("paid_at", { withTimezone: true, mode: 'string' }),
	updatedBy: uuid("updated_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	forMonthD: date("for_month_d").notNull(),
	notes: text(),
	householdId: text("household_id").notNull(),
	proofImageId: uuid("proof_image_id"),
	amount: numeric({ precision: 12, scale:  6 }),
}, (table) => [
	uniqueIndex("billId_month").using("btree", table.billId.asc().nullsLast().op("date_ops"), table.forMonthD.asc().nullsLast().op("date_ops")),
	index("month_idx").using("btree", table.forMonthD.asc().nullsLast().op("date_ops")),
	index("payment_household_idx").using("btree", table.householdId.asc().nullsLast().op("text_ops")),
	uniqueIndex("proof_image_idx").using("btree", table.proofImageId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.billId],
			foreignColumns: [bills.id],
			name: "payments_bill_id_bills_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.householdId],
			foreignColumns: [households.id],
			name: "payments_household_id_households_id_fk"
		}),
	foreignKey({
			columns: [table.proofImageId],
			foreignColumns: [objects.id],
			name: "payments_proof_image_id_objects_id_fk"
		}).onUpdate("cascade").onDelete("set null"),
	foreignKey({
			columns: [table.updatedBy],
			foreignColumns: [users.id],
			name: "payments_updated_by_users_id_fk"
		}).onDelete("set null"),
]);

export const invites = pgTable("invites", {
	id: text().default(generate_ulid()).primaryKey().notNull(),
	toEmail: text("to_email").notNull(),
	toId: uuid("to_id").notNull(),
	fromEmail: text("from_email").notNull(),
	fromId: uuid("from_id").notNull(),
	householdId: text("household_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
	expiresAt: timestamp("expires_at", { mode: 'string' }).default(sql`(now() + '30 days'::interval)`).notNull(),
}, (table) => [
	index("from_id_idx").using("btree", table.fromId.asc().nullsLast().op("uuid_ops")),
	index("invites_household_idx").using("btree", table.householdId.asc().nullsLast().op("text_ops")),
	index("to_id_idx").using("btree", table.toId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.fromId],
			foreignColumns: [users.id],
			name: "invites_from_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.householdId],
			foreignColumns: [households.id],
			name: "invites_household_id_households_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.toId],
			foreignColumns: [users.id],
			name: "invites_to_id_users_id_fk"
		}),
]);

export const bills = pgTable("bills", {
	id: text().default(generate_ulid()).primaryKey().notNull(),
	billName: text("bill_name").notNull(),
	dueDate: integer("due_date").default(16).notNull(),
	householdId: text("household_id").notNull(),
	notes: text(),
	currency: text().default('USD').notNull(),
	amount: doublePrecision().default(0).notNull(),
}, (table) => [
	index("household_idx").using("btree", table.householdId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.householdId],
			foreignColumns: [households.id],
			name: "bills_household_id_households_id_fk"
		}).onDelete("cascade"),
]);

export const households = pgTable("households", {
	id: text().default(generate_ulid()).primaryKey().notNull(),
	name: text().notNull(),
	createdAt: date("created_at").defaultNow().notNull(),
	ownerId: uuid("owner_id"),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
}, (table) => [
	index("name_index").using("btree", table.name.asc().nullsLast().op("text_ops")),
	index("owner_id").using("btree", table.ownerId.asc().nullsLast().op("uuid_ops")),
	index("updated_at_idx").using("btree", table.updatedAt.asc().nullsLast().op("timestamp_ops")),
	foreignKey({
			columns: [table.ownerId],
			foreignColumns: [users.id],
			name: "households_owner_id_users_id_fk"
		}).onDelete("set null"),
]);

export const usersToHouseholds = pgTable("users_to_households", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	householdId: text("household_id").notNull(),
}, (table) => [
	index("household_household_id_index").using("btree", table.householdId.asc().nullsLast().op("text_ops")),
	index("household_user_id_index").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	uniqueIndex("user_id_household_id_index").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.householdId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.householdId],
			foreignColumns: [households.id],
			name: "users_to_households_household_id_households_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "users_to_households_user_id_users_id_fk"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const jobRuns = pgTable("job_runs", {
	id: text().default(generate_ulid()).primaryKey().notNull(),
	jobName: text("job_name").notNull(),
	ranAt: timestamp("ran_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	created: integer().default(0).notNull(),
	skipped: integer().default(0).notNull(),
	durationMs: integer("duration_ms").default(0).notNull(),
	error: text(),
});
