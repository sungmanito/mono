import { getBill } from '$lib/server/actions/bills.actions.js';
import { validateUserSession } from '$lib/util/session.js';
import { error } from '@sveltejs/kit';

export const load = async ({ locals, params }) => {
  const session = await locals.getSession();

  if (!validateUserSession(session)) error(401);

  console.info('GETTING BILL');
  const bill = await getBill(params.id);

  return {
    bill,
    households: locals.userHouseholds.map((h) => h.households),
  };
};
