import { getUserHouseholds } from '$lib/server/actions/households.actions.js';
import { getPayments } from '$lib/server/actions/payments.actions.js';
import { db } from '$lib/server/db/client.js';
import { schema } from '$lib/server/db/index.js';
import { redirect } from '@sveltejs/kit';
import { and, eq, inArray } from 'drizzle-orm';

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