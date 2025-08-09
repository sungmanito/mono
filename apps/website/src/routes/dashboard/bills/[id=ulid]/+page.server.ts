import { getBill } from '$lib/server/actions/bills.actions';
import { db } from '$lib/server/db/client';
import { validateUserSession } from '$lib/util/session';
import { error } from '@sveltejs/kit';

export const load = async ({ locals, params }) => {
  const session = await locals.getSession();
  if (!validateUserSession(session)) error(401);

  const bill = await getBill(params.id);

  return {
    bill,
    payments: db.query.payments.findMany({
      where(fields, operators) {
        return operators.eq(fields.billId, params.id);
      },
      orderBy(fields, operators) {
        return operators.desc(fields.forMonthD);
      },
      // Full year's worth
      limit: 12,
    }),
  };
};
