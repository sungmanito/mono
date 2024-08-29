import { db } from '$lib/server/db/client.js';
import { validateFormData } from '$lib/util/formData.js';
import { validateUserSession } from '$lib/util/session.js';
import { error } from '@sveltejs/kit';
import { type } from 'arktype';
import { exportedSchema as schema } from '@sungmanito/db';
import { eq, and, inArray } from 'drizzle-orm';

export const load = async ({ locals, params }) => {
  const session = await locals.getSession();

  if (!validateUserSession(session)) error(401, 'Unauthorized');
  const { id } = params;

  const bill = db.query.bills.findFirst({
    where({ id: idColumn, householdId }, { eq, and, inArray }) {
      return and(
        eq(idColumn, id),
        inArray(
          householdId,
          locals.userHouseholds.map((h) => h.households.id),
        ),
      );
    },
  });

  return {
    bill,
  };
};

export const actions = {
  deleteBill: async ({ request, locals, params }) => {
    const session = await locals.getSession();
    if (!validateUserSession(session)) error(401);

    const formData = validateFormData(
      await request.formData(),
      type({
        'bill-id': 'string',
      }),
    );

    if (formData['bill-id'] !== params.id) error(400);

    const households = locals.userHouseholds.map((h) => h.households.id);
    const [deleted] = await db
      .delete(schema.bills)
      .where(
        and(
          eq(schema.bills.id, formData['bill-id']),
          inArray(schema.bills.householdId, households),
        ),
      )
      .returning();

    if (!deleted) {
      console.info('undefined deleted, sending 400');
      error(400);
    }

    return { deleted };
  },
};
