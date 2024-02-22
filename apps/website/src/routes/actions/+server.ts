import { db } from '$lib/server/db/client.js';
import { exportedSchema } from '@sungmanito/db';
import type { RequestHandler } from './$types';
import { and, eq } from 'drizzle-orm';
import type { PaymentUpdateArgs } from '$lib/server/actions/payments.actions';
import { json } from '@sveltejs/kit';

// Temporary thing to create a thing for the payments.
export const GET: RequestHandler = async () => {
  // Do some sort of JWT check to make sure this isn't getting hit randomly

  const today = new Date();
  const currentMonth = today.getMonth() + 1;

  const bills = await db
    .select()
    .from(exportedSchema.bills)
    .leftJoin(
      exportedSchema.payments,
      and(
        eq(exportedSchema.payments.billId, exportedSchema.bills.id),
        eq(exportedSchema.payments.forMonth, today.getMonth() + 1),
      ),
    );

  const mapped = bills.map((v) => {
    return {
      // if thre is a payment associated with this month already, we do not want to modify it.
      id: v.payments?.id,
      billId: v.bills.id,
      forMonth: currentMonth,
      forMonthD: new Date(
        `${today.getFullYear()}-${currentMonth}-${v.bills.dueDate}`,
      ),
      householdId: v.bills.householdId,
    } as PaymentUpdateArgs;
  });

  const response = await db
    .insert(exportedSchema.payments)
    .values(mapped)
    .onConflictDoNothing({
      target: [
        exportedSchema.payments.billId,
        exportedSchema.payments.forMonth,
      ],
    })
    .returning()
    .execute();

  // return new Response();
  return json(response);
};
