import { db } from '$lib/server/db';
import schema from '@sungmanito/db';
import { validateFormData } from '@jhecht/arktype-utils';
import { redirect } from '@sveltejs/kit';
import { type } from 'arktype';
import { and, eq, sql, getTableColumns, asc } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

const household = alias(schema.households, 'household');

export const load = async ({ locals, depends }) => {
  const session = await locals.getSession();

  if (!session || !session.user) {
    redirect(303, '/login');
  }

  depends('household:payments');
  depends('household:bills');

  const today = new Date();

  const fuckers = db
    .select({
      ...getTableColumns(schema.bills),
      householdName: schema.households.name,
      status: sql<
        'overdue' | 'upcoming' | 'paid'
      >`case when ${schema.payments.paidAt} is not null then 'paid'::text when ${schema.bills.dueDate} < ${today.getDate()} then 'overdue'::text else 'upcoming'::text end`,
      payment: schema.payments,
    })
    .from(schema.bills)
    .innerJoin(
      schema.households,
      eq(schema.bills.householdId, schema.households.id),
    )
    .innerJoin(
      schema.usersToHouseholds,
      and(
        eq(schema.usersToHouseholds.userId, session.user.id),
        eq(schema.usersToHouseholds.householdId, schema.households.id),
      ),
    )
    .leftJoin(
      schema.payments,
      and(
        eq(
          sql`extract('month' from ${schema.payments.forMonthD})`,
          today.getMonth() + 1,
        ),
        eq(schema.payments.billId, schema.bills.id),
      ),
    );

  const fullQuery = await db
    .select()
    .from(schema.bills)
    .innerJoin(
      schema.usersToHouseholds,
      eq(schema.usersToHouseholds.userId, session.user.id),
    )
    .innerJoin(
      household,
      and(
        eq(schema.bills.householdId, household.id),
        eq(schema.usersToHouseholds.householdId, household.id),
      ),
    )
    .leftJoin(
      schema.payments,
      and(
        eq(
          sql`extract('month' from ${schema.payments.forMonthD})`,
          today.getMonth() + 1,
        ),
        eq(schema.payments.billId, schema.bills.id),
      ),
    )
    .orderBy(asc(schema.bills.dueDate));

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
      id: schema.households.id,
      name: schema.households.name,
      createdAt: schema.households.createdAt,
      householdCount: sql<number>`count(${schema.households.id})`.mapWith(
        (value) => Number(value),
      ),
    })
    .from(schema.households)
    .innerJoin(
      schema.usersToHouseholds,
      and(
        eq(schema.usersToHouseholds.userId, session.user.id),
        eq(schema.households.id, schema.usersToHouseholds.householdId),
      ),
    )
    .groupBy(schema.households.id);

  return {
    bills: fullQuery,
    groupings,
    households: userHouseholds,
    fuckers,
  };
};

export const actions = {
  addBill: async ({ request, locals }) => {
    const session = await locals.getSession();
    const data = await request.formData();
    const today = new Date();
    console.info(data);
    const formData = validateFormData(
      data,
      type({
        'bill-name': 'string',
        'household-id': 'string',
        'due-date': 'number',
      }),
    );

    if (session && session.user) {
      const [bill] = await db
        .insert(schema.bills)
        .values({
          billName: formData['bill-name'],
          householdId: formData['household-id'],
          dueDate: sql<string>`${data.get('due-date')}::integer`,
        })
        .returning();

      // If the bill is further forward in the month than the current date, we must assume that the user wants to track this bill for this month too
      if (bill.dueDate > today.getDate()) {
        await db.insert(schema.payments).values({
          billId: bill.id,
          forMonthD: new Date(
            today.getFullYear(),
            today.getMonth(),
            bill.dueDate,
          ),
          householdId: bill.householdId,
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
