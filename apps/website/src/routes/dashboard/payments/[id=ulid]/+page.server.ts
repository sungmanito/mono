import { db } from '$lib/server/db/client.js';
import { exportedSchema as schema } from '@sungmanito/db';
import { validateUserSession } from '$lib/util/session.js';
import { error } from '@sveltejs/kit';
import { and, eq, inArray, sql } from 'drizzle-orm';

export const load = async ({ locals, params }) => {
  const session = await locals.getSession();

  // Validate the session
  if (!validateUserSession(session)) throw error(401);

  // Grab the user's households.
  const userHouseholds = locals.userHouseholds;

  const [payment] = await db
    .select()
    .from(schema.payments)
    .innerJoin(schema.bills, eq(schema.bills.id, schema.payments.billId))
    .innerJoin(
      schema.households,
      eq(schema.households.id, schema.payments.householdId),
    )
    .innerJoin(
      schema.users,
      eq(schema.users.id, sql`${schema.payments.updatedBy}::uuid`),
    )
    .where(
      and(
        inArray(
          schema.payments.householdId,
          userHouseholds.map((f) => f.households.id),
        ),
        eq(schema.payments.id, params.id),
      ),
    );

  // Throw a 404 error if we do not have a payment option.
  if (!payment) throw error(404);

  // Return the payment for this page.
  return {
    payment,
  };
};
