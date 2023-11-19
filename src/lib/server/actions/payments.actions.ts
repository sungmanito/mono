import * as schema from '$lib/server/db/schema';
import { db } from '$lib/server/db';
import { getUserHouseholds } from './households.actions';
import { and, eq, inArray } from 'drizzle-orm';
import { error } from '@sveltejs/kit';

export type Payment = typeof schema.payments.$inferSelect;
export type PaymentInsertArgs = Omit<typeof schema.payments.$inferInsert, 'id'>;
export type PaymentUpdateArgs = Partial<PaymentInsertArgs & Pick<Payment, 'id'>>;

export async function getPaymentsForUserHouseholds(userId: string, month: number = (new Date().getMonth() + 1)) {
  const households = await getUserHouseholds(userId);
  return db
    .select()
    .from(schema.payments)
    .innerJoin(
      schema.bills,
      and(
        eq(schema.bills.id, schema.payments.billId),
        inArray(schema.bills.householdId, households.map(h => h.households.id))
      )
    )
    .where(eq(schema.payments.forMonth, month))
    .orderBy(schema.payments.paidAt);
}

/**
 * @description This is an admin-level payments API you should not be using it 
 * generally
 */
export async function getPayments() {
  return db
    .select()
    .from(schema.payments)
    .innerJoin(
      schema.bills,
      eq(schema.bills.id, schema.payments.billId)
    )
    .innerJoin(
      schema.households,
      eq(schema.households.id, schema.bills.householdId)
    );
}

export async function updatePayments(paymentId: string, args: PaymentUpdateArgs) {
  return db
    .update(schema.payments)
    .set(args)
    .where(
      eq(schema.payments.id, paymentId)
    )
    .returning();
}

export async function getPayment(paymentId: Payment['id']) {
  return db.select()
    .from(schema.payments)
    .where(eq(schema.payments.id, paymentId))
}

export async function createPayment(data: PaymentInsertArgs) {
  return db.insert(schema.payments)
    .values(data)
    .returning()
    .then(([f]) => f);
}

export async function addProofToPayment(paymentId: Payment['id'], proof: Payment['proof'], updatedBy: string) {

  if(proof === '' || updatedBy === '') throw error(400);

  return db.update(schema.payments)
    .set({
      proof,
      updatedBy,
      paidAt: new Date(),
    })
    .where(eq(schema.payments.id, paymentId))
    .returning()
    .then(r => r[0]);
}
