import { db } from "$lib/server/db"
import { bills as billsTable, households, usersToHouseholds } from "$lib/server/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { error, redirect } from '@sveltejs/kit'
import { getUserHouseholds } from "$lib/server/actions/households.actions.js";
import { getBill, updateBill, type BillUpdateArgs } from "$lib/server/actions/bills.actions.js";

export const load = async ({ locals }) => {
  const session = await locals.getSession();

  if(!session || !session?.user) {
    throw redirect(300, '/login');
  }

  const bills = await db
    .select({
      billId: billsTable.id,
      billName: billsTable.billName,
      billDueDate: billsTable.dueDate,
      householdId: billsTable.householdId,
      householdName: households.name
    })
    .from(billsTable)
    .innerJoin(
      households,
      eq(households.id, billsTable.householdId)
    )
    .innerJoin(
      usersToHouseholds,
      and(
        eq(usersToHouseholds.householdId, households.id),
        eq(usersToHouseholds.userId, session.user.id)
      )
    )
    .orderBy(households.name, billsTable.dueDate);


  const userHouseholds = getUserHouseholds(session.user.id);
  
  return {
    bills: bills,
    households: userHouseholds
  };
}

export const actions = {
  updateBill: async ({ request, locals }) => {

    const session = await locals.getSession();

    if(!session || !session?.user) throw error(401, 'nope');

    const data = await request.formData();
    const billId = data.get('bill-id');
    const userHouseholds = await getUserHouseholds(session.user.id);

    if(!billId || typeof billId !== 'string') throw error(400, 'No bill ID provided');

    const base  = await getBill(billId);

    if(!userHouseholds.some(f => f.households.id === base.householdId)) {
      throw error(400, 'You are not authorized to modify this bill');
    }

    const dueDate = Number(data.get('due-date') || 1);

    if(isNaN(dueDate)) {
      throw error(400, 'Bad request');
    }

    if(dueDate < 1 || dueDate > 28) {
      throw error(400, 'Invalid due date');
    }

    const obj: BillUpdateArgs = {
      dueDate,
      householdId: data.get('household-id') as string,
      billName: data.get('bill-name') as string,
    };

    const newBill = await updateBill(billId, obj);

    if(!newBill) throw error(405, 'Update failed');

    return {
      status: 200,
      bill: newBill,
    };
    
  },
  deleteBill: async ({ request, locals }) => {

    const session = await locals.getSession();
    const formData = await request.formData();

    if(!session || !session.user) throw error(401, 'Not logged in');

    const parsedData = Object.fromEntries(formData.entries());

    const userHouseholds = await getUserHouseholds(session.user.id);

    const resp = await db.delete(billsTable)
      .where(
        and(
          eq(billsTable.id, parsedData['bill-id'] as string),
          inArray(billsTable.householdId, userHouseholds.map(v => v.households.id)),
        )
      )
      .returning();
    
    if (resp.length !== 1) throw error(400, 'Bill not found');

    return {
      success: true,
      status: 200,
      bill: resp[0],
    };

  }
}