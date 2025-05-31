import { db } from '$lib/server/db/client.js';
import schema from '@sungmanito/db';
import { json } from '@sveltejs/kit';
import { and, between, eq, getTableColumns, lt, sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';

// Temporary thing to create a thing for the payments.
export const GET: RequestHandler = async () => {
  // Do some sort of JWT check to make sure this isn't getting hit randomly

  // Get all bills and payments coming up in the next 5 days
  const bills = await db
    .select({
      ...getTableColumns(schema.bills),
      payments: getTableColumns(schema.payments),
      nextMonth: sql<number>`extract('month' from now() + interval '5 days')::integer`,
      nextYear: sql<number>`extract('year' from now() + interval '5 days')::integer`,
    })
    .from(schema.bills)
    .leftJoin(
      schema.payments,
      and(
        eq(schema.payments.billId, schema.bills.id),
        between(
          schema.payments.forMonthD,
          sql`now()`,
          sql`now() + interval '5 days'`,
        ),
      ),
    )
    .where(
      lt(
        schema.bills.dueDate,
        sql`extract('day' from now() + interval '5 days')`,
      ),
    );

  const mapped = bills.map((bill) => {
    return {
      id: bill?.payments?.id,
      billId: bill.id,
      forMonthD: new Date(`${bill.nextYear}-${bill.nextMonth}-${bill.dueDate}`),
      householdId: bill.householdId,
    } satisfies typeof schema.payments.$inferInsert;
  });

  const results = await db
    .insert(schema.payments)
    .values(mapped)
    .onConflictDoNothing({
      target: [schema.payments.billId, schema.payments.forMonthD],
    })
    .returning()
    .execute();

  return json(results, { status: 201 });
};
