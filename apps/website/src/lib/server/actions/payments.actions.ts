import { db } from '$lib/server/db';
import { exportedSchema as schema } from '@sungmanito/db';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { error } from '@sveltejs/kit';
import { and, eq, getTableColumns, inArray } from 'drizzle-orm';
import { getUserHouseholds } from './households.actions';

export type Payment = typeof schema.payments.$inferSelect;
export type PaymentInsertArgs = Omit<typeof schema.payments.$inferInsert, 'id'>;
export type PaymentUpdateArgs = Partial<
  PaymentInsertArgs & Pick<Payment, 'id'>
>;

export async function getPaymentsForUserHouseholds(
  userId: string,
  month: number = new Date().getMonth() + 1,
) {
  const households = await getUserHouseholds(userId);
  return db
    .select()
    .from(schema.payments)
    .innerJoin(
      schema.bills,
      and(
        eq(schema.bills.id, schema.payments.billId),
        inArray(
          schema.bills.householdId,
          households.map((h) => h.households.id),
        ),
      ),
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
    .innerJoin(schema.bills, eq(schema.bills.id, schema.payments.billId))
    .innerJoin(
      schema.households,
      eq(schema.households.id, schema.bills.householdId),
    );
}

export async function updatePayment(
  paymentId: string,
  args: PaymentUpdateArgs,
) {
  return db
    .update(schema.payments)
    .set(args)
    .where(eq(schema.payments.id, paymentId))
    .returning();
}

/**
 * @description Will either return the payment or throw an error
 * @param paymentId
 * @param session
 * @returns
 */
export async function getPayment(paymentId: Payment['id'], session: Session) {
  return db
    .select({
      ...getTableColumns(schema.payments),
      billName: schema.bills.billName,
    })
    .from(schema.payments)
    .innerJoin(schema.bills, eq(schema.bills.id, schema.payments.billId))
    .where(
      and(
        eq(schema.payments.id, paymentId),
        inArray(
          schema.payments.householdId,
          db
            .select({
              data: schema.usersToHouseholds.householdId,
            })
            .from(schema.usersToHouseholds)
            .where(eq(schema.usersToHouseholds.userId, session.user.id)),
        ),
      ),
    )
    .then((r) => {
      if (r.length !== 1) {
        throw new Error('Invalid ID ' + paymentId);
      }
      return r[0];
    });
}

export async function createPayment(data: PaymentInsertArgs) {
  return db
    .insert(schema.payments)
    .values(data)
    .returning()
    .then(([f]) => f);
}

export async function addImageProofToPayment(
  paymentId: Payment['id'],
  image: File,
  supabase: SupabaseClient['storage'],
) {
  console.info(paymentId, image, supabase);
  return false;
}

export async function addProofToPayment(
  paymentId: Payment['id'],
  proof: Payment['proof'],
  updatedBy: string,
) {
  if (proof === '' || updatedBy === '') error(400);

  return db
    .update(schema.payments)
    .set({
      proof,
      updatedBy,
      paidAt: new Date(),
    })
    .where(eq(schema.payments.id, paymentId))
    .returning()
    .then((r) => r[0]);
}
