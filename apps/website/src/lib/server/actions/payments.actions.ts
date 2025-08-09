import { PAYMENT_BUCKET_NAME } from '$env/static/private';
import { db } from '$lib/server/db';
import type { TransactionContext } from '$utils/drizzle';
import { allowedImageTypes } from '$utils/images';
import { validateFormData } from '@jhecht/arktype-utils';
import { exportedSchema as schema } from '@sungmanito/db';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { error } from '@sveltejs/kit';
import { type } from 'arktype';
import { and, eq, getTableColumns, inArray, sql } from 'drizzle-orm';
import { getUserHouseholds } from './households.actions';
import { getImageId, uploadImage } from './images.actions';

export type Payment = typeof schema.payments.$inferSelect;
export type PaymentInsertArgs = Omit<typeof schema.payments.$inferInsert, 'id'>;
export type PaymentUpdateArgs = Partial<
  PaymentInsertArgs & Pick<Payment, 'id'>
>;

export const updatePaymentValidator = type({
  'proof?': 'File',
  'notes?': 'string',
  'amount?': "number | ''",
});

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
    .where(eq(sql`extract('month' from ${schema.payments.forMonthD})`, month))
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
      billAmount: schema.bills.amount,
      billCurrency: schema.bills.currency,
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

export async function addProofToPayment(
  paymentId: Payment['id'],
  proof: Payment['proofImage'],
  updatedBy: string,
) {
  if (proof === '' || updatedBy === '') error(400);

  return db
    .update(schema.payments)
    .set({
      proofImage: proof,
      updatedBy,
      paidAt: new Date(),
    })
    .where(eq(schema.payments.id, paymentId))
    .returning()
    .then((r) => r[0]);
}

export async function makePayments(
  fd: FormData,
  supabase: SupabaseClient,
  session: Session,
  households: string[],
) {
  const rawData = validateFormData(
    fd,
    type({
      id: 'string[]',
      'household-id': 'string',
    }),
  );
  const ids = rawData;

  const userId = session.user.id;

  const all = await Promise.allSettled(
    ids.id.map(async (id) => {
      const validatedData = updatePaymentValidator.assert(rawData[id]);

      const updateArgs: PaymentUpdateArgs = {
        id,
        paidAt: new Date(),
        updatedBy: userId,
      };

      if (typeof validatedData.amount === 'number') {
        updateArgs.amount = validatedData.amount.toString();
      }

      if (validatedData.notes && validatedData.notes.length > 0) {
        updateArgs.notes = validatedData.notes;
      }

      if (validatedData['proof'] && validatedData.proof.size > 0) {
        const proof = validatedData['proof'];
        const fileName = proof.name;
        const ext = fileName.split('.').at(-1);

        if (!ext) throw { reason: 'No extension' };

        if (proof.size > 1024 * 1024)
          throw new Error(`File size for image ${proof.name} too large`);

        const uploadName = `${ids['household-id']}/${id}.${ext}`;
        let result: Awaited<ReturnType<typeof uploadImage>>;

        try {
          result = await uploadImage(
            supabase,
            PAYMENT_BUCKET_NAME,
            proof,
            uploadName,
          );
        } catch (e) {
          throw new Error(`Something bad happened ${id}`);
        }

        if (result) {
          const imageId = await getImageId(PAYMENT_BUCKET_NAME, uploadName);
          updateArgs.proofImage = imageId;
        }
      }

      await db
        .update(schema.payments)
        .set(updateArgs)
        .where(
          and(
            eq(schema.payments.id, id),
            inArray(schema.payments.householdId, households),
          ),
        )
        .returning();

      return {
        householdId: ids['household-id'],
        data: updateArgs,
      };
    }),
  );

  console.info(
    'ALL',
    all.map((f) => f.status === 'fulfilled' && f.value),
  );

  return {
    success: all.filter((f) => f.status === 'fulfilled'),
    failed: all.filter((f) => f.status === 'rejected'),
  };
}

export type UpdatePaymentWithImage = Pick<Payment, 'id' | 'householdId'> &
  Omit<PaymentUpdateArgs, 'id' | 'householdId'> & {
    proof: File;
  };

/**
 * @description Making multiple payments, especially if they have
 * proof images, is a bit of a pain. This function is a placeholder
 * for now and will be implemented later.
 */
export async function makeMultiplePayments(
  tx: TransactionContext,
  fd: UpdatePaymentWithImage[],
  supabase: SupabaseClient,
  session: Session,
) {
  /**
   * 1. Upload all images to the bucket in parallel using promise.allSettled
   * 2. Update all payments in the database with the uploaded image URLs
   * 3. Along with the payment update, update the other fields like amount, notes,
   * paidAt, updatedBy
   */
  const allImageUploads = await Promise.allSettled(
    fd.map(async (f) => {
      const fileName = f.proof.name;
      console.info('File name', fileName);
      return [
        f.id,
        allowedImageTypes.has(f.proof.type)
          ? await uploadImage(
              supabase,
              PAYMENT_BUCKET_NAME,
              f.proof,
              `${f.householdId}/${f.id}.${fileName.split('.').at(-1)}`,
            )
              .then((r) => getImageId(PAYMENT_BUCKET_NAME, r.path))
              .catch((e) => {
                console.error('Error uploading image:', e);
                console.error(
                  'filename',
                  `${f.householdId}/${f.id}.${fileName.split('.').at(-1)}`,
                );
                return null;
              })
          : null,
      ] as const;
    }),
  );

  const user = session.user;

  console.info(allImageUploads);

  const updatePaymentsArgs: PaymentUpdateArgs[] = allImageUploads
    .filter((a) => a.status === 'fulfilled')
    .map(({ value: [id, response] }) => {
      return {
        id,
        updatedBy: user.id,
        proofImage: response,
        paidAt: new Date(),
      } as const;
    });

  console.info('UPDATE ARGS', updatePaymentsArgs);

  const responses = await db.transaction(async (tx) => {
    const re = await Promise.allSettled(
      updatePaymentsArgs.map((args) => {
        return tx
          .update(schema.payments)
          .set(args)
          .where(eq(schema.payments.id, args.id))
          .returning();
      }),
    );
    return re;
  });

  console.info(responses);

  return;
}
