import { db } from '$lib/server/db';
import { exportedSchema } from '@sungmanito/db';
import { formDataValidObject } from '$lib/util/formData.js';
import { redirect } from '@sveltejs/kit';
import { type } from 'arktype';
import { and, eq, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

const household = alias(exportedSchema.households, 'household');

export const load = async ({ locals, depends }) => {
  const session = await locals.getSession();

  if (!session || !session.user) {
    redirect(303, '/login');
  }

  depends('household:payments');
  depends('household:bills');

  const today = new Date();

  const fullQuery = await db
    .select()
    .from(exportedSchema.bills)
    .innerJoin(
      exportedSchema.usersToHouseholds,
      eq(exportedSchema.usersToHouseholds.userId, session.user.id),
    )
    .innerJoin(
      household,
      and(
        eq(exportedSchema.bills.householdId, household.id),
        eq(exportedSchema.usersToHouseholds.householdId, household.id),
      ),
    )
    .leftJoin(
      exportedSchema.payments,
      and(
        eq(exportedSchema.payments.forMonth, today.getMonth() + 1),
        eq(exportedSchema.payments.billId, exportedSchema.bills.id),
      ),
    );

  const todaysDate = today.getDate();

  const groupings = fullQuery.reduce(
    (all, cur) => {
      const diff = today.getDate() - cur.bills.dueDate;

      if (cur.payments !== null && cur.payments.paidAt !== null) {
        all.paid.push(cur);
        return all;
      }

      if (
        todaysDate > cur.bills.dueDate &&
        (cur.payments === null ||
          (cur.payments !== null && cur.payments.paidAt === null))
      ) {
        all.past.push(cur);
        return all;
      }

      if (diff > -5 && diff < 0) {
        all.upcoming.push(cur);
        return all;
      }

      if (diff >= 5 && diff < 10) {
        all.comingSoon.push(cur);
        return all;
      }

      all.rest.push(cur);

      return all;
    },
    {
      upcoming: [],
      comingSoon: [],
      paid: [],
      past: [],
      rest: [],
    } as Record<
      'upcoming' | 'comingSoon' | 'paid' | 'past' | 'rest',
      (typeof fullQuery)[number][]
    >,
  );

  const userHouseholds = await db
    .select({
      id: exportedSchema.households.id,
      name: exportedSchema.households.name,
      createdAt: exportedSchema.households.createdAt,
      householdCount:
        sql<number>`count(${exportedSchema.households.id})`.mapWith((value) =>
          Number(value),
        ),
    })
    .from(exportedSchema.households)
    .innerJoin(
      exportedSchema.usersToHouseholds,
      and(
        eq(exportedSchema.usersToHouseholds.userId, session.user.id),
        eq(
          exportedSchema.households.id,
          exportedSchema.usersToHouseholds.householdId,
        ),
      ),
    )
    .groupBy(exportedSchema.households.id);

  return {
    bills: fullQuery,
    groupings,
    households: userHouseholds,
  };
};

export const actions = {
  addBill: async ({ request, locals }) => {
    const session = await locals.getSession();
    const data = await request.formData();
    const today = new Date();
    const formData = formDataValidObject(
      data,
      type({
        'bill-name': 'string',
        'household-id': 'string',
        'due-date': 'number',
      }),
    );

    if (session && session.user) {
      const [bill] = await db
        .insert(exportedSchema.bills)
        .values({
          billName: formData['bill-name'],
          householdId: formData['household-id'],
          dueDate: sql<string>`${data.get('due-date')}::integer`,
        })
        .returning();

      // If the bill is further forward in the month than the current date, we must assume that the user wants to track this bill for this month too
      if (bill.dueDate > today.getDate()) {
        await db.insert(exportedSchema.payments).values({
          billId: bill.id,
          forMonthD: new Date(
            today.getFullYear(),
            today.getMonth(),
            bill.dueDate,
          ),
          householdId: bill.householdId,
          forMonth: today.getMonth() + 1,
        });
      }

      return {
        success: true,
        bill,
        type: 'add-bill',
      };
    }

    return {
      success: false,
      type: 'add-bill',
    };
  },
};
