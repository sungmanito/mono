import {
  getUserBills,
  type BillInsertArgs,
} from '$lib/server/actions/bills.actions.js';
import { db } from '$lib/server/db';
import { exportedSchema } from '@sungmanito/db';
// import { bills as billsTable } from '$lib/server/db/schema';
import { formDataValidObject, validateFormData } from '$lib/util/formData.js';
import { validateUserSession } from '$lib/util/session.js';
import { error, fail, redirect } from '@sveltejs/kit';
import { type, scope } from 'arktype';
import { and, eq, inArray } from 'drizzle-orm';
import { validate } from '$lib/util/ark-utils.js';

export const load = async ({ locals }) => {
  const session = await locals.getSession();

  if (!validateUserSession(session)) {
    throw redirect(300, '/login');
  }

  const bills = await getUserBills(session.user.id);

  return {
    bills: bills,
    households: locals.userHouseholds,
  };
};

export const actions = {
  addBill: async ({ locals, request }) => {
    const session = await locals.getSession();
    if (!validateUserSession(session)) throw error(401);

    const validator = scope({
      DueDate: '1<=number<=28',
      formData: {
        name: 'string[]',
        'household-id': 'string[]',
        'due-date': 'DueDate[]',
      },
    }).compile();

    const formData = validateFormData(
      await request.formData(),
      validator.formData,
    );

    // convert the households to a set to thin out repeated entries.
    // convert back to array to utilize the .every method
    const submittedHouseholds = Array.from(
      new Set<string>(formData['household-id']),
    );

    console.info(
      'TESTING',
      submittedHouseholds.every(
        (id) =>
          locals.userHouseholds.findIndex((h) => h.households.id === id) !== -1,
      ),
    );

    // If the user is not a member of the household, yeet an error
    if (
      !submittedHouseholds.every(
        (id) =>
          locals.userHouseholds.findIndex((h) => h.households.id === id) !== -1,
      )
    )
      return fail(401, {
        message: 'Cannot add bill to household you are not a member of',
      });

    console.info('made it');

    const insertBills: BillInsertArgs[] = Array.from(
      { length: formData['household-id'].length },
      (_, i) => ({
        billName: formData.name[i],
        dueDate: formData['due-date'][i],
        householdId: formData['household-id'][i],
      }),
    );

    const newBills = await db
      .insert(exportedSchema.bills)
      .values(insertBills)
      .returning();

    if (newBills.length === 0) {
      throw error(403, 'Bill(s) could not be created');
    }

    return {
      bills: newBills,
    };
  },
  updateBill: async ({ request, locals }) => {
    const session = await locals.getSession();

    if (!session || !session?.user) throw error(401, 'nope');

    const data = formDataValidObject(
      await request.formData(),
      type({
        'bill-id': 'string',
        'bill-name': 'string',
        'household-id': 'string',
        'due-date': '1<=number<=28',
      }),
    );

    const userHouseholds = locals.userHouseholds;

    if (
      userHouseholds.findIndex(
        (uh) => uh.households.id === data['household-id'],
      ) === -1
    )
      error(400, 'Not authorized');

    const [response] = await db
      .update(exportedSchema.bills)
      .set({
        billName: data['bill-name'],
        dueDate: data['due-date'],
        householdId: data['household-id'],
      })
      .where(eq(exportedSchema.bills.id, data['bill-id']))
      .returning();

    if (response === undefined) error(400);

    return {
      status: 200,
      bill: response,
    };
  },
  deleteBill: async ({ request, locals }) => {
    const session = await locals.getSession();

    if (!session || !session.user) throw error(401, 'Not logged in');
    if (!validateUserSession(session)) error(401);

    const data = formDataValidObject(
      await request.formData(),
      type({
        'bill-id': 'string',
      }),
    );

    const [deleted] = await db
      .delete(exportedSchema.bills)
      .where(
        and(
          eq(exportedSchema.bills.id, data['bill-id']),
          inArray(
            exportedSchema.bills.householdId,
            locals.userHouseholds.map((h) => h.households.id),
          ),
        ),
      )
      .returning();

    if (!deleted) throw error(400, 'Bill not found');

    return {
      bill: deleted,
    };
  },
};
