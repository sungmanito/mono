import { validateUserSession } from '$lib/util/session.js';
import { error } from '@sveltejs/kit';

export const load = async ({ locals, parent, params, depends }) => {
  const session = await locals.getSession();
  depends('user:households');

  if (!validateUserSession(session)) {
    error(300, '/login');
  }

  const parentData = await parent();

  const household = parentData.households.find((h) => h.id === params.id);

  if (!household) error(400);

  return {
    household,
  };
};
