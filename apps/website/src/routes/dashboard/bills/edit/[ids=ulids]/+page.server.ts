import { db } from '$lib/server/db';
import { validateUserSession } from '$utils/session.js';
import { validateFormData } from '@jhecht/arktype-utils';
import schema from '@sungmanito/db';
import { error } from '@sveltejs/kit';
import { type } from 'arktype';
import { and, eq, getTableColumns, inArray } from 'drizzle-orm';

export const load = async ({ locals, params }) => {
  const session = await locals.getSession();

  if (!validateUserSession(session)) {
    error(401);
  }

  const ids = params.ids.split(',');

  // Retrieve all bills by their ids and ensure they belong to the user's households
  const bills = await db
    .select({
      ...getTableColumns(schema.bills),
      householdName: schema.households.name,
    })
    .from(schema.bills)
    .innerJoin(
      schema.households,
      eq(schema.bills.householdId, schema.households.id),
    )
    .where(
      and(
        inArray(schema.bills.id, ids),
        inArray(
          schema.bills.householdId,
          locals.userHouseholds.map((h) => h.households.id),
        ),
      ),
    );

  return {
    bills,
    households: locals.userHouseholds.map((h) => ({
      value: h.households.id,
      label: h.households.name,
    })),
  };
};

export const actions = {
  save: async ({ request, locals, params }) => {
    const session = await locals.getSession();

    if (!validateUserSession(session)) {
      error(401);
    }

    const updateBill = type({
      id: 'string',
      name: 'string',
      householdId: 'string',
      dueDate: '1<=number.integer<=28',
    });

    const billsValidator = type({
      bills: updateBill.array(),
    });

    const billsRaw = validateFormData(await request.formData(), billsValidator);
    const allowedIds = params.ids.split(',');
    const userHouseholdIds = locals.userHouseholds.map((h) => h.households.id);

    // Only allow updates for bills whose id is in params.ids
    const billsArgs = billsRaw.bills.filter((b) => allowedIds.includes(b.id));

    // Validate householdId for each bill
    for (const bill of billsArgs) {
      if (!userHouseholdIds.includes(bill.householdId)) {
        return error(400, `Invalid household for bill ${bill.id}`);
      }
    }

    // Remove id from update object, only allow updating allowed fields
    const updates = billsArgs.map((b) => ({
      billName: b.name,
      householdId: b.householdId,
      dueDate: b.dueDate,
      id: b.id, // keep id for WHERE clause only
    }));

    const result = await db.transaction(async (tx) => {
      const updated = [];
      for (const b of updates) {
        // Only update if id is in allowedIds and householdId is owned by user
        const rows = await tx
          .update(schema.bills)
          .set({
            billName: b.billName,
            householdId: b.householdId,
            dueDate: b.dueDate,
          })
          .where(
            and(
              eq(schema.bills.id, b.id),
              inArray(schema.bills.id, allowedIds),
              inArray(schema.bills.householdId, userHouseholdIds),
            ),
          )
          .returning();
        updated.push(...rows);
      }
      return updated;
    });
    return {
      updatedBills: result,
      updatedCount: result.length,
    };
  },
};
