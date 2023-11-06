import { db } from '$lib/server/db/client.js';
import { bills as billsTable } from '$lib/server/db/schema/bills.table.js';
import { payments } from '$lib/server/db/schema/payments.table.js';
import type { RequestHandler } from './$types';
import { and, eq } from 'drizzle-orm';

// Temporary thing to create a thing for the payments.
export const GET: RequestHandler = async () => {

  const d = new Date();
  const bills = await db
    .select()
    .from(billsTable)
    .leftJoin(payments, and(eq(payments.billId, billsTable.id), eq(payments.forMonth, d.getMonth() + 1)));

  return new Response();
}