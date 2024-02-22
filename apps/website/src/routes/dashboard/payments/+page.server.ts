import { getUserHouseholds } from '$lib/server/actions/households.actions.js';
import type {
  PaymentUpdateArgs
} from '$lib/server/actions/payments.actions.js';
import { db } from '$lib/server/db/client.js';
import { formDataToObject, validateFormData } from '$lib/util/formData.js';
import { validateUserSession } from '$lib/util/session.js';
import { exportedSchema as schema } from '@sungmanito/db';
import { error, fail, redirect } from '@sveltejs/kit';
import { and, eq, inArray } from 'drizzle-orm';
import { formDataToObject, validateFormData } from '$lib/util/formData.js';
import {
  updatePayment,
  type PaymentUpdateArgs,
} from '$lib/server/actions/payments.actions.js';
import { validateUserSession } from '$lib/util/session.js';
import { instanceOf, type } from 'arktype';

export const load = async ({ locals, depends }) => {
  const today = new Date();
  const session = await locals.getSession();
  depends('household:payments');

  if (!validateUserSession(session)) {
    throw redirect(300, '/login');
  }

  const households = await getUserHouseholds(session.user.id);

  const payments = await db
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
    .where(eq(schema.payments.forMonth, today.getMonth() + 1))
    .orderBy(schema.payments.forMonth);

  return {
    payments,
  };
};

export const actions = {
  updatePayment2: async ({ locals, request }) => {
    const session = await locals.getSession();
    if (!validateUserSession(session)) throw error(401);

    const updateArgs: PaymentUpdateArgs = {
      paidAt: new Date(),
    };

    console.info(updateArgs);

    const formData = validateFormData(
      await request.formData(),
      type({
        'payment-id': 'string',
        'household-id': 'string',
        proof: 'string',
        'proof-file?': instanceOf(File),
      }),
    );

    console.info(formData);

    // if we have a proof file we're going to need to upload it to the stash
    if (formData['proof-file']) {
      const file = formData['proof-file'];
      console.info(file.size);
      if (file.size > 1024 * 1024) throw error(400, 'File too large');
      const bucket = locals.supabase.storage.from('payment-proof');
      const fileExt = file.name.split('.')[1]?.toLowerCase();
      if (!fileExt) throw error(400, 'Invalid file extension');

      const fileName = `${formData['household-id']}/${formData['payment-id']}.${fileExt}`;

      const { data: signed, error: signingErr } =
        await bucket.createSignedUploadUrl(fileName);

      if (signingErr) {
        console.error(signingErr);
        throw error(400);
      }

      const { data: success, error: uploadErr } =
        await bucket.uploadToSignedUrl(
          `${formData['household-id']}/${formData['payment-id']}.${file.name.split('.')[1].toLowerCase()}`,
          signed.token,
          file,
        );

      if (!success) {
        console.error(uploadErr);
        return fail(400);
      }

      const [entry] = await db
        .select({
          id: schema.objects.id,
        })
        .from(schema.objects)
        .where(eq(schema.objects.name, success.path));

      if (!entry) {
        throw error(400, 'File upload error');
      }
      // Set the proof image ID to our new proof
      updateArgs.proofImage = entry.id;
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
  updatePayment: async ({ locals, request }) => {
    const session = await locals.getSession();
<<<<<<< Updated upstream

    if (!validateUserSession(session)) throw error(401);

    const formData = validateFormData(
      await request.formData(),
      type({
        'payment-id': 'string',
        proof: 'string',
        'proof-file?': instanceOf(File),
      }),
    );

    // const formData = formDataToObject(await request.formData());

    if (
      !formData['payment-id'] ||
      typeof formData['payment-id'] !== 'string' ||
      typeof formData['proof'] !== 'string'
    )
      throw error(400, 'Invalid payment');

    // Grab the user households
    const userHouseholds = await getUserHouseholds(session.user.id);

    const verified = await db
      .select()
      .from(schema.payments)
      .where(
        and(
          inArray(
            schema.payments.householdId,
            userHouseholds.map((f) => f.households.id),
          ),
          eq(schema.payments.id, formData['payment-id']),
        ),
      );

    if (verified.length !== 1) throw error(401, 'Not authorized');

    const newData = await updatePayment(formData['payment-id'], {
      proof: formData['proof'],
      paidAt: new Date(),
      updatedBy: session.user.id,
    });

    // Double check that this is a payment that belongs to us.

    return {
      updated: newData,
    };
=======
    if (!validateUserSession(session)) throw error(401);

    const updateArgs: PaymentUpdateArgs = {
      paidAt: new Date(),
      updatedBy: session.user.id,
    };

    const formData = validateFormData(
      await request.formData(),
      type({
        'payment-id': 'string',
        'household-id': 'string',
        proof: 'string',
        'proof-file?': instanceOf(File),
      }),
    );

    // if we have a proof file we're going to need to upload it to the stash
    if (formData['proof-file']) {
      const file = formData['proof-file'];
      // We are limiting file size
      if (file.size > 1024 * 1024) throw error(400, 'File too large');
      // Grab the bucket we are uploading to
      const bucket = locals.supabase.storage.from('payment-proof');
      // Grab the file extension
      const fileExt = file.name.split('.')[1]?.toLowerCase();
      // If we don't have a file extension, invalid file.
      if (!fileExt) throw error(400, 'Invalid file extension');

      // Create the filename. Consits of householdId/paymentId.[fileExt]
      const fileName = `${formData['household-id']}/${formData['payment-id']}.${fileExt}`;

      // Create the signed upload url
      const { data: signed, error: signingErr } =
        await bucket.createSignedUploadUrl(fileName);

      // If we had a signing error, then something went wrong and we need to bail
      if (signingErr) {
        // before bailing, give us some logs to read
        console.error(signingErr);
        throw error(400);
      }

      const { data: success, error: uploadErr } =
        await bucket.uploadToSignedUrl(
          `${formData['household-id']}/${formData['payment-id']}.${file.name.split('.')[1].toLowerCase()}`,
          signed.token,
          file,
        );

      if (!success) {
        console.error(uploadErr);
        return fail(400);
      }

      const [entry] = await db
        .select({
          id: schema.objects.id,
        })
        .from(schema.objects)
        .where(eq(schema.objects.name, success.path));

      if (!entry) {
        throw error(400, 'File upload error');
      }
      // Set the proof image ID to our new proof
      updateArgs.proofImage = entry.id;
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
>>>>>>> Stashed changes
  },
  unpayBill: async ({ locals, request }) => {
    const session = await locals.getSession();

    if (!validateUserSession(session)) throw error(401);

    const userHouseholds = locals.userHouseholds;

    const formData = formDataToObject(await request.formData());

    if (!formData.paymentId || typeof formData.paymentId !== 'string')
      throw error(400);

    const [payment] = await db
      .update(schema.payments)
      .set({
        proof: '',
        updatedBy: session.user.id,
        paidAt: null,
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
