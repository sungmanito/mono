import { validateUserSession } from '$lib/util/session.js';
import { error } from '@sveltejs/kit';

export const load = async ({ url, locals }) => {
  const session = await locals.getSession();
  if (!validateUserSession(session)) error(401, 'not logged in');

  const households = locals.userHouseholds.map((h) => h.households);

  const searchParams = new URLSearchParams(url.search);

  const initialBills: { name: string; dueDate: number; household: string }[] =
    [];

  if (searchParams.has('household-id[]')) {
    const ids = searchParams.getAll('household-id[]');
    for (const id of ids)
      initialBills.push({
        household: id,
        name: '',
        dueDate: 1,
      });
  }

  return {
    households,
    initialBills,
  };
};
