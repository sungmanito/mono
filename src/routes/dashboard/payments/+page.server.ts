import { getUserHouseholds } from '$lib/server/actions/households.actions.js';
import { db } from '$lib/server/db/client.js';
import { schema } from '$lib/server/db/index.js';
import { error, redirect } from '@sveltejs/kit';
import { and, eq, inArray } from 'drizzle-orm';
import { formDataToObject } from '$lib/util/formData.js';
import { updatePayments } from '$lib/server/actions/payments.actions.js';

export const load = async ({ locals }) => {
  const today = new Date();
  const session = await locals.getSession();

  if(!session || !session.user) {
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
        inArray(schema.bills.householdId, households.map(h => h.households.id)),
      )
    )
    .where(eq(schema.payments.forMonth, today.getMonth() + 1))
    .orderBy(schema.payments.forMonth);

  return {
    payments,
  };
}

export const actions = {
  updatePayment: async ({ locals, request }) => {
    const session = await locals.getSession();

    if(!session || !session.user) throw error(401);

    const formData = formDataToObject(await request.formData());

    if(!formData['payment-id'] || typeof formData['payment-id'] !== 'string' || typeof formData['proof'] !== 'string') throw error(400, 'Invalid payment');

    // Grab the user households
    const userHouseholds = await getUserHouseholds(session.user.id);

    const verified = await db.select()
      .from(schema.payments)
      .where(
        and(
          inArray(schema.payments.householdId, userHouseholds.map(f => f.households.id)),
          eq(schema.payments.id, formData['payment-id'])
        )
      )

    if(verified.length !== 1) throw error(401, 'Not authorized');

    const newData = await updatePayments(formData['payment-id'], {
      proof: formData['proof'],
      paidAt: new Date(),
    });

    // Double check that this is a payment that belongs to us.
    
    return {
      updated: newData,
    };
  }
}