import {
  getUserBills,
  type BillInsertArgs,
} from '$lib/server/actions/bills.actions.js';
import { db } from '$lib/server/db';
import { exportedSchema } from '@sungmanito/db';
import { validateFormData } from '@jhecht/arktype-utils';
import { validateUserSession } from '$lib/util/session.js';
import { error, fail, redirect } from '@sveltejs/kit';
import { scope, type } from 'arktype';
import { and, eq, inArray } from 'drizzle-orm';

function padCalendar(inp: string | number) {
  return `0${inp}`.slice(-2);
}

export const load = async ({ locals, depends }) => {
  const session = await locals.getSession();

  depends('user:bills');

  if (!validateUserSession(session)) {
    redirect(300, '/login');
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
    if (!validateUserSession(session)) error(401);

    const validator = scope({
      DueDate: '1<=number<=28',
      formData: {
        name: 'string[]',
        'household-id': 'string[]',
        'due-date': 'DueDate[]',
      },
    }).type('formData');

    let formData: typeof validator.infer;

    try {
      formData = validateFormData(await request.formData(), validator);
    } catch (e) {
      if (e instanceof type.errors)
        return fail(400, {
          message: e.issues,
        });
      console.error(e);
      return fail(500);
    }

    // convert the households to a set to thin out repeated entries.
    // convert back to array to utilize the .every method
    const submittedHouseholds = Array.from(
      new Set<string>(formData['household-id']),
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

    const insertBills: BillInsertArgs[] = Array.from(
      { length: formData['household-id'].length },
      (_, i) => ({
        billName: formData.name[i],
        dueDate: formData['due-date'][i],
        householdId: formData['household-id'][i],
      }),
    );

    const bills = await db.transaction(async (tx) => {
      const newBills = await tx
        .insert(exportedSchema.bills)
        .values(insertBills)
        .returning();

      const rightNow = new Date();

      const payments = await tx
        .insert(exportedSchema.payments)
        .values(
          newBills.map((bill) => ({
            billId: bill.id,
            forMonthD: new Date(
              `${rightNow.getFullYear()}-${padCalendar(rightNow.getMonth() + 1)}-${padCalendar(bill.dueDate).slice(-2)}T00:00:00Z`,
            ),
            householdId: bill.householdId,
          })),
        )
        .returning();

      if (newBills.length === 0 || payments.length === 0) {
        tx.rollback();
      }

      return newBills;
    });

    return {
      bills,
    };
  },
  updateBill: async ({ request, locals }) => {
    const session = await locals.getSession();

    if (!session || !session?.user) error(401, 'nope');

    const data = validateFormData(
      await request.formData(),
      type({
        'bill-id': 'string',
        'bill-name': 'string',
        'household-id': 'string',
        'due-date': '1<=number<=28',
        'amount?': 'number>=0',
        'currency?': 'string>=3 & /[A-Z]{3}/',
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
        amount: data['amount']
          ? Math.max(0, Number(data['amount']))
          : undefined,
        currency: data['currency'] ? data['currency'].toUpperCase() : undefined,
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

    if (!validateUserSession(session)) error(401);

    const data = validateFormData(
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

    if (!deleted) error(400, 'Bill not found');

    return {
      bill: deleted,
    };
  },
};
