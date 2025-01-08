import { PAYMENT_BUCKET_NAME } from '$env/static/private';
import { getUserHouseholds } from '$lib/server/actions/households.actions.js';
import {
  getImageId,
  removeImageById,
  uploadImage,
} from '$lib/server/actions/images.actions.js';
import {
  getPayment,
  type PaymentUpdateArgs,
} from '$lib/server/actions/payments.actions.js';
import { db } from '$lib/server/db/client.js';
import { validateFormData } from '$lib/util/formData.js';
import { validateUserSession } from '$lib/util/session.js';
import { exportedSchema as schema } from '@sungmanito/db';
import { error, fail, redirect } from '@sveltejs/kit';
import { instanceOf, type } from 'arktype';
import { and, eq, getTableColumns, inArray, sql } from 'drizzle-orm';

export const load = async ({ locals, depends }) => {
  const today = new Date();
  const session = await locals.getSession();
  depends('household:payments');

  if (!validateUserSession(session)) {
    redirect(300, '/login');
  }

  const households = await getUserHouseholds(session.user.id);

  const payments = await db
    .select({
      ...getTableColumns(schema.payments),
      billName: schema.bills.billName,
      household: schema.households,
    })
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
    .innerJoin(
      schema.households,
      eq(schema.households.id, schema.payments.householdId),
    )
    .where(
      eq(
        sql`extract('month' from ${schema.payments.forMonthD})`,
        today.getMonth() + 1,
      ),
    )
    .orderBy(schema.payments.forMonthD);

  return {
    payments,
  };
};

export const actions = {
  updatePayment: async ({ locals, request }) => {
    const session = await locals.getSession();
    if (!validateUserSession(session)) error(401);
    const formValidator = type({
      'payment-id': 'string',
      'household-id': 'string',
      'proof-file?': instanceOf(File),
      'notes?': 'string',
      'amount?': "number | ''",
    });
    let formData: typeof formValidator.infer;

    try {
      formData = validateFormData(await request.formData(), formValidator);
    } catch (e) {
      console.error('SHITS FUCKED');
      console.error(e);
      return fail(400);
    }

    const updateArgs: PaymentUpdateArgs = {
      paidAt: new Date(),
      updatedBy: session.user.id,
      amount: formData.amount?.toString() || null,
      notes: formData.notes || null,
    };

    // if we have a proof file we're going to need to upload it to the stash
    if (formData['proof-file'] && formData['proof-file'].name !== '') {
      const file = formData['proof-file'];
      if (file.size > 1024 * 1024) error(400, 'File too large');

      const fileExt = file.name.split('.')[1]?.toLowerCase();

      if (!fileExt) error(400, 'Invalid file extension');

      const fileName = `${formData['household-id']}/${formData['payment-id']}.${fileExt}`;
      let result: Awaited<ReturnType<typeof uploadImage>>;
      try {
        result = await uploadImage(
          locals.supabase,
          PAYMENT_BUCKET_NAME,
          file,
          fileName,
        );
      } catch (e) {
        console.error(e);
        return fail(400);
      }

      if (result) {
        const id = await getImageId(PAYMENT_BUCKET_NAME, fileName);
        updateArgs.proofImage = id;
      }
    }

    const [row] = await db
      .update(schema.payments)
      .set(updateArgs)
      .where(
        and(
          eq(schema.payments.id, formData['payment-id']),
          inArray(
            schema.payments.householdId,
            locals.userHouseholds.map((h) => h.households.id),
          ),
        ),
      )
      .returning();

    if (row) return row;

    return fail(400);
  },
  unpayBill: async ({ locals, request }) => {
    const session = await locals.getSession();

    if (!validateUserSession(session)) error(401);

    const userHouseholds = locals.userHouseholds;

    const formData = validateFormData(
      await request.formData(),
      type({
        paymentId: 'string',
      }),
    );

    let currentPayment: Awaited<ReturnType<typeof getPayment>>;
    try {
      currentPayment = await getPayment(formData['paymentId'], session);
    } catch (e) {
      console.error(e);
      return fail(400);
    }

    // There might be some parallelization that we could do here.

    if (currentPayment.proofImage !== null) {
      // we need to delete this image.
      await removeImageById(currentPayment.proofImage, locals.supabase);
    }

    const [payment] = await db
      .update(schema.payments)
      .set({
        proofImage: null,
        updatedBy: session.user.id,
        paidAt: null,
        notes: null,
      })
      .where(
        and(
          eq(schema.payments.id, formData.paymentId),
          inArray(
            schema.payments.householdId,
            userHouseholds.map((f) => f.households.id),
          ),
        ),
      )
      .returning();

    return {
      success: true,
      payment: payment,
    };
  },
};
