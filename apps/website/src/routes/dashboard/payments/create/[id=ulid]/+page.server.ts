import { getPayment } from '$lib/server/actions/payments.actions.js';
import { validateUserSession } from '$lib/util/session.js';
import { redirect } from '@sveltejs/kit';

export const load = async ({ locals, params }) => {
  const session = await locals.getSession();
  if (!validateUserSession(session)) {
    redirect(300, '/login');
  }
  // Fetch the payment info
  const payment = await getPayment(params.id, session);
  return {
    payment,
  };
};
