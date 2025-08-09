import { db } from '$lib/server/db/client';
import { validateUserSession } from '$utils/session';
import { error } from '@sveltejs/kit';
import { isValid } from 'ulidx';
import { inArray, getTableColumns, eq, and } from 'drizzle-orm';
import schema from '@sungmanito/db';

export const load = async ({ locals, url }) => {
  const session = await locals.getSession();

  if (!validateUserSession(session)) {
    throw error(401, 'Unauthorized');
  }

  const paymentIds = Array.from(url.searchParams.getAll('payments[]')).filter(
    (id) => isValid(id),
  );

  const paymentInfo = await db
    .select({
      ...getTableColumns(schema.payments),
      householdName: schema.households.name,
      billName: schema.bills.billName,
      billAmount: schema.bills.amount,
      billCurrency: schema.bills.currency,
    })
    .from(schema.payments)
    .innerJoin(
      schema.households,
      eq(schema.payments.householdId, schema.households.id),
    )
    .innerJoin(
      schema.usersToHouseholds,
      and(
        eq(schema.usersToHouseholds.householdId, schema.households.id),
        eq(schema.usersToHouseholds.userId, session.user.id),
      ),
    )
    .innerJoin(schema.bills, eq(schema.payments.billId, schema.bills.id))
    .where(inArray(schema.payments.id, paymentIds));

  return {
    payments: paymentInfo,
  };
};
