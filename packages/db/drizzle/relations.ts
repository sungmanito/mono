import { relations } from "drizzle-orm/relations";
import { bills, payments, households, objectsInStorage, usersInAuth, invites, usersToHouseholds } from "./schema";

export const paymentsRelations = relations(payments, ({one}) => ({
	bill: one(bills, {
		fields: [payments.billId],
		references: [bills.id]
	}),
	household: one(households, {
		fields: [payments.householdId],
		references: [households.id]
	}),
	objectsInStorage: one(objectsInStorage, {
		fields: [payments.proofImageId],
		references: [objectsInStorage.id]
	}),
	usersInAuth: one(usersInAuth, {
		fields: [payments.updatedBy],
		references: [usersInAuth.id]
	}),
}));

export const billsRelations = relations(bills, ({one, many}) => ({
	payments: many(payments),
	household: one(households, {
		fields: [bills.householdId],
		references: [households.id]
	}),
}));

export const householdsRelations = relations(households, ({one, many}) => ({
	payments: many(payments),
	invites: many(invites),
	bills: many(bills),
	usersInAuth: one(usersInAuth, {
		fields: [households.ownerId],
		references: [usersInAuth.id]
	}),
	usersToHouseholds: many(usersToHouseholds),
}));

export const objectsInStorageRelations = relations(objectsInStorage, ({many}) => ({
	payments: many(payments),
}));

export const usersInAuthRelations = relations(usersInAuth, ({many}) => ({
	payments: many(payments),
	invites_fromId: many(invites, {
		relationName: "invites_fromId_usersInAuth_id"
	}),
	invites_toId: many(invites, {
		relationName: "invites_toId_usersInAuth_id"
	}),
	households: many(households),
	usersToHouseholds: many(usersToHouseholds),
}));

export const invitesRelations = relations(invites, ({one}) => ({
	usersInAuth_fromId: one(usersInAuth, {
		fields: [invites.fromId],
		references: [usersInAuth.id],
		relationName: "invites_fromId_usersInAuth_id"
	}),
	household: one(households, {
		fields: [invites.householdId],
		references: [households.id]
	}),
	usersInAuth_toId: one(usersInAuth, {
		fields: [invites.toId],
		references: [usersInAuth.id],
		relationName: "invites_toId_usersInAuth_id"
	}),
}));

export const usersToHouseholdsRelations = relations(usersToHouseholds, ({one}) => ({
	household: one(households, {
		fields: [usersToHouseholds.householdId],
		references: [households.id]
	}),
	usersInAuth: one(usersInAuth, {
		fields: [usersToHouseholds.userId],
		references: [usersInAuth.id]
	}),
}));