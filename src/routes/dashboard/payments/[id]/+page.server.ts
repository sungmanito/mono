import { getPayment } from '$lib/server/actions/payments.actions.js';
import { db } from '$lib/server/db/client.js';
import { schema } from '$lib/server/db/index.js';
import { validateUserSession } from '$lib/util/session.js';
import { error } from '@sveltejs/kit';
import { and, eq, inArray } from 'drizzle-orm';

export const load = async ({ locals, params }) => {

  const session = await locals.getSession();

  if(!validateUserSession(session)) throw error(401);

  const userHouseholds = locals.userHouseholds;

  console.info(params.id, userHouseholds);

  const [payment] = await db.select()
    .from(schema.payments)
    .where( 
      and(
        inArray(
          schema.payments.householdId,
          userHouseholds.map(f => f.households.id)
        ),
        eq(schema.payments.id, params.id),
      )
    );

  if(!payment) throw error(400);
  // Fetch payment
  // return payment

  return {
    payment,
  };
}
