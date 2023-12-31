import { db } from "$lib/server/db"
import { bills, bills as billsTable, households, usersToHouseholds } from "$lib/server/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { error, redirect } from '@sveltejs/kit'
import { getUserHouseholds } from "$lib/server/actions/households.actions.js";
import { getBill, updateBill, type BillUpdateArgs } from "$lib/server/actions/bills.actions.js";
import { validateUserSession } from '$lib/util/session.js';
import { formDataValidObject } from '$lib/util/formData.js';
import { type } from 'arktype';

export const load = async ({ locals }) => {
  const session = await locals.getSession();

  if(!session || !session?.user) {
    throw redirect(300, '/login');
  }

  const bills = await db
    .select({
      id: billsTable.id,
      billName: billsTable.billName,
      dueDate: billsTable.dueDate,
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
    households: locals.userHouseholds, 
  };
}

export const actions = {
  addBill: async ({ locals, request }) => {
    const session = await locals.getSession();
    if(!validateUserSession(session)) throw error(401);

    const formData = formDataValidObject(await request.formData(), type({
      name: 'string',
      'household-id': 'string',
      'due-date': '1<=number<=28'
    }));

    // If the user is not a member of the household, yeet an error
    if(locals.userHouseholds.findIndex(f => f.households.id === formData['household-id']) === -1) 
      throw error(400, 'Cannot add bill to household you are not a member of');

    const [bill] = await db.insert(billsTable)
      .values({
        dueDate: formData['due-date'],
        billName: formData.name,
        householdId: formData['household-id'],
      })
      .returning();
    
    if(!bill) {
      throw error(403, 'Bill could not be created'); 
    }
    
    return {
      bill,
    }
  },
  updateBill: async ({ request, locals }) => {

    const session = await locals.getSession();

    if(!session || !session?.user) throw error(401, 'nope');

    const data = await request.formData();
    const billId = data.get('bill-id');

    if(!billId || typeof billId !== 'string') throw error(400, 'No bill ID provided');

    const userHouseholds = locals.userHouseholds;

    if(!userHouseholds.some(f => f.households.id === billId)) {
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
      bill: response
    };
    
  },
  deleteBill: async ({ request, locals }) => {

    const session = await locals.getSession();

    if(!session || !session.user) throw error(401, 'Not logged in');

    const data = formDataValidObject(await request.formData(), type({
      'bill-id': 'string',
    }));

    const [deleted] = await db.delete(billsTable)
      .where(
        and(
          eq(billsTable.id, data['bill-id']),
          inArray(
            billsTable.householdId, locals.userHouseholds.map(h => h.households.id)
          )
        )
      )
      .returning();
    
    if (resp.length !== 1) throw error(400, 'Bill not found');

    return {
      bill: deleted
    };

  }
}