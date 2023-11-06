import { db } from "$lib/server/db";
import { error, type Action } from "@sveltejs/kit";
import { bills, households, payments, usersToHouseholds } from '$lib/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

const household = alias(households, 'household');

export const load = async ({ locals }) => {

  const session = await locals.getSession();

  if(!session || !session.user) {
    throw error(401, 'Not logged in');
  }

  const today = new Date();

  const fullQuery = await db
    .select()
    .from(bills)
    .innerJoin(usersToHouseholds, eq(usersToHouseholds.userId, session.user.id))
    .innerJoin(household, and(eq(bills.householdId, household.id), eq(usersToHouseholds.householdId, household.id)))
    .leftJoin(payments, and(eq(payments.forMonth, today.getMonth() + 1 ), eq(payments.billId, bills.id)));

  const todaysDate = today.getDate();
  const groupings = fullQuery.reduce((all, cur) => {
    const diff = today.getDate() - cur.bills.dueDate;

    if(cur.payments !== null && cur.payments.paidAt !== null) {
      all.paid.push(cur);
      return all;
    }

    if(todaysDate > cur.bills.dueDate && cur.payments === null) {
      all.past.push(cur);
      return all;
    }

    if(diff > -5 && diff < 0) {
      all.upcoming.push(cur);
      return all;
    }

    if(diff >= 5 && diff < 10) {
      all.comingSoon.push(cur);
      return all;
    }

    all.rest.push(cur);

    
    return all;
  }, {
    upcoming: [],
    comingSoon: [],
    paid: [],
    past: [],
    rest: []
  } as Record<'upcoming' | 'comingSoon' | 'paid' | 'past' | 'rest', typeof fullQuery[0][]>);

  const userHouseholds = await db
    .select({
      id: households.id,
      name: households.name,
      createdAt: households.createdAt,
      householdCount: sql<number>`count(${households.id})`.mapWith(value => Number(value))
    })
    .from(households)
    .innerJoin(
      usersToHouseholds,
      and(
        eq(usersToHouseholds.userId, session.user.id),
        eq(households.id, usersToHouseholds.householdId)
      )
    )
    .groupBy(households.id);

  return {
    bills: fullQuery,
    groupings,
    households: userHouseholds,
  };
}

export const actions = {
  addBill: async ({ request, locals }) => {
    const session = await locals.getSession();
    const data = await request.formData();
    const today = new Date();

    if(session && session.user) {
      const [bill] = await db.insert(bills).values({
        billName: data.get('bill-name') || 'default',
        householdId: data.get('household-id') || '01',
        dueDate: sql<string>`${data.get('due-date')}::integer`
      }).returning();

      // If the bill is further forward in the month than the current date, we must assume that the user wants to track this bill for this month too
      if(bill.dueDate > today.getDate()) {
        await db.insert(payments).values({
          forMonth: today.getMonth() + 1,
          billId: bill.id,
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
  }
};
