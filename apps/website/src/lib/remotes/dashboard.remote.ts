import { query } from '$app/server';
import schema from '@sungmanito/db';
import { and, asc, eq, getTableColumns, sql } from 'drizzle-orm';
import { getUser } from './common.remote';
import { db } from '$lib/server/db';

export const getUserHouseholdBills = query(async () => {
  const user = await getUser();
  const today = new Date();

  return db
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
        eq(schema.usersToHouseholds.userId, user.id),
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
        eq(
          sql`extract('year' from ${schema.payments.forMonthD})`,
          sql`extract('year' from now())`,
        ),
        eq(schema.payments.billId, schema.bills.id),
      ),
    )
    .orderBy(asc(schema.bills.dueDate));
});
