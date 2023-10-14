import { db } from '$lib/server/db/client.js';
import { error } from '@sveltejs/kit';

export const load = async ({ params }) => {

  const household = await db.query.households.findFirst({
    where: ({ id }, { eq }) => eq(id, params.id),
    with: {
      users: true,
    }
  });

  if (!household) {
    throw error(404, { message: 'Invalid ID'});
  }
  
  return {
    household,
    success: true,
  };
};