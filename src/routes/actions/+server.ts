import { db } from '$lib/server/db/client.js';
import { bills as billsTable } from '$lib/server/db/schema/bills.table.js';
import { payments } from '$lib/server/db/schema/payments.table.js';
import type { RequestHandler } from './$types';
import { and, eq } from 'drizzle-orm';
import type { PaymentUpdateArgs } from "$lib/server/actions/payments.actions";
import { json } from '@sveltejs/kit';

// Temporary thing to create a thing for the payments.
export const GET: RequestHandler = async () => {

  // Do some sort of JWT check to make sure this isn't getting hit randomly

  const today = new Date();
  const currentMonth = today.getMonth() + 1;

  const bills = await db
    .select()
    .from(billsTable)
    .leftJoin(payments, and(eq(payments.billId, billsTable.id), eq(payments.forMonth, today.getMonth() + 1)));

  const mapped = bills.map(v => {
    return {
      // if thre is a payment associated with this month already, we do not want to modify it.
      id: v.payments?.id,
      billId: v.bills.id,
      forMonth: currentMonth,
      forMonthD: new Date(`${today.getFullYear()}-${currentMonth}-${v.bills.dueDate}`),
      householdId: v.bills.householdId,
    } as PaymentUpdateArgs;
  });

  console.info(mapped);

  const response = await db.insert(payments)
    .values(mapped)
    .onConflictDoNothing({
      target: [payments.billId, payments.forMonth]
    })
    .returning()
    .execute();

  // return new Response();
  return json(response);
}