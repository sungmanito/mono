import { query, form } from '$app/server';
import { db } from '$lib/server/db';
import { exportedSchema as schema } from '@sungmanito/db';
import { and, eq, getTableColumns, inArray } from 'drizzle-orm';
import { getUser, getUserHouseholds } from './common.remote';
import { getUserHouseholdBills } from './dashboard.remote';
import { type } from 'arktype';
import { ulidValidator } from '$lib/typesValidators';

export const getUserBills = query(async () => {
  const user = await getUser();

  return (
    db
      .select({
        ...getTableColumns(schema.bills),
        householdName: schema.households.name,
      })
      // Selecting from bills
      .from(schema.bills)
      // Joining in on the households table to get the household name
      .innerJoin(
        schema.households,
        eq(schema.households.id, schema.bills.householdId),
      )
      // Means we need to get the households this user is a member of.
      .innerJoin(
        schema.usersToHouseholds,
        and(
          eq(schema.usersToHouseholds.householdId, schema.households.id),
          eq(schema.usersToHouseholds.userId, user.id),
        ),
      )
      // Some ordering to more normalize the results.
      .orderBy(schema.bills.dueDate)
  );
});

/**
 * Fetches a single bill by ID, ensuring it belongs to the current user's households.
 */
export const getBill = query(ulidValidator, async (id) => {
  const userHouseholds = await getUserHouseholds();
  return db
    .select({ ...getTableColumns(schema.bills), household: schema.households })
    .from(schema.bills)
    .innerJoin(
      schema.households,
      eq(schema.bills.householdId, schema.households.id),
    )
    .where(
      and(
        eq(schema.bills.id, id),
        inArray(
          schema.bills.householdId,
          userHouseholds.map((h) => h.id),
        ),
      ),
    )
    .limit(1)
    .then((r) => r[0]);
});

/**
 * Fetches a single bill with its 12-month payment history.
 */
export const getBillWithPayments = query(ulidValidator, async (id) => {
  const userHouseholds = await getUserHouseholds();

  const [bill, payments] = await Promise.all([
    db
      .select({
        ...getTableColumns(schema.bills),
        household: schema.households,
      })
      .from(schema.bills)
      .innerJoin(
        schema.households,
        eq(schema.bills.householdId, schema.households.id),
      )
      .where(
        and(
          eq(schema.bills.id, id),
          inArray(
            schema.bills.householdId,
            userHouseholds.map((h) => h.id),
          ),
        ),
      )
      .limit(1)
      .then((r) => r[0]),

    db.query.payments.findMany({
      where: (fields, { eq }) => eq(fields.billId, id),
      orderBy: (fields, { desc }) => desc(fields.forMonthD),
      limit: 12,
    }),
  ]);

  return { ...bill, payments };
});

/**
 * Fetches multiple bills by IDs, scoped to the current user's households.
 */
export const getBillsByIds = query(type('string[]'), async (ids) => {
  const userHouseholds = await getUserHouseholds();
  return db
    .select({
      ...getTableColumns(schema.bills),
      householdName: schema.households.name,
    })
    .from(schema.bills)
    .innerJoin(
      schema.households,
      eq(schema.bills.householdId, schema.households.id),
    )
    .where(
      and(
        inArray(schema.bills.id, ids),
        inArray(
          schema.bills.householdId,
          userHouseholds.map((h) => h.id),
        ),
      ),
    );
});

const billCreateValidator = type({
  'name[]': 'string[]',
  'household-id[]': 'string[]',
  'due-date[]': 'string[]',
  'amount[]': 'string[]',
  'currency[]': 'string[]',
});

/**
 * Creates one or more bills with an initial payment for the current month.
 */
export const createBill = form(billCreateValidator, async (data) => {
  const userHouseholds = await getUserHouseholds();
  const householdIds = userHouseholds.map((h) => h.id);

  const names = data['name[]'];
  const householdIdsInput = data['household-id[]'];
  const dueDates = data['due-date[]'].map(Number);
  const amounts = data['amount[]'].map(Number);
  const currencies = data['currency[]'];

  // Validate all submitted households belong to the user
  if (!householdIdsInput.every((id) => householdIds.includes(id))) {
    throw new Error('Cannot add bill to a household you are not a member of');
  }

  const today = new Date();

  const bills = await db.transaction(async (tx) => {
    const newBills = await tx
      .insert(schema.bills)
      .values(
        Array.from({ length: names.length }, (_, i) => ({
          billName: names[i],
          householdId: householdIdsInput[i],
          dueDate: dueDates[i],
          amount: amounts[i] > 0 ? amounts[i] : undefined,
          currency: currencies[i] || 'USD',
        })),
      )
      .returning();

    // Create initial payment for bills due later in the current month
    const paymentsToInsert = newBills
      .filter((bill) => bill.dueDate >= today.getDate())
      .map((bill) => ({
        billId: bill.id,
        forMonthD: new Date(
          today.getFullYear(),
          today.getMonth(),
          bill.dueDate,
        ),
        householdId: bill.householdId,
      }));

    if (paymentsToInsert.length > 0) {
      await tx.insert(schema.payments).values(paymentsToInsert);
    }

    return newBills;
  });

  getUserBills().refresh();
  getUserHouseholdBills().refresh();

  return bills;
});

const billUpdateValidator = type({
  'bill-id': 'string',
  'bill-name': 'string',
  'household-id': 'string',
  'due-date': 'string',
  'amount?': 'string',
  'currency?': 'string',
});

/**
 * Updates a single bill.
 */
export const updateBill = form(billUpdateValidator, async (data) => {
  const userHouseholds = await getUserHouseholds();

  if (!userHouseholds.some((h) => h.id === data['household-id'])) {
    throw new Error('Not authorized to update this bill');
  }

  const dueDate = Number(data['due-date']);
  if (dueDate < 1 || dueDate > 28) {
    throw new Error('Due date must be between 1 and 28');
  }

  const [updated] = await db
    .update(schema.bills)
    .set({
      billName: data['bill-name'],
      dueDate,
      householdId: data['household-id'],
      amount: data['amount'] ? Number(data['amount']) : undefined,
      currency: data['currency'] ? data['currency'].toUpperCase() : undefined,
    })
    .where(
      and(
        eq(schema.bills.id, data['bill-id']),
        inArray(
          schema.bills.householdId,
          userHouseholds.map((h) => h.id),
        ),
      ),
    )
    .returning();

  getUserBills().refresh();
  getUserHouseholdBills().refresh();
  if (updated) getBill(updated.id).refresh();

  return updated;
});

const billsBatchUpdateValidator = type({
  'bills[].id': 'string[]',
  'bills[].name': 'string[]',
  'bills[].householdId': 'string[]',
  'bills[].dueDate': 'string[]',
  'bills[].amount': 'string[]',
});

/**
 * Batch-updates multiple bills.
 */
export const updateBills = form(billsBatchUpdateValidator, async (data) => {
  const userHouseholds = await getUserHouseholds();
  const userHouseholdIds = userHouseholds.map((h) => h.id);

  const ids = data['bills[].id'];
  const names = data['bills[].name'];
  const householdIds = data['bills[].householdId'];
  const dueDates = data['bills[].dueDate'].map(Number);
  const amounts = data['bills[].amount'].map(Number);

  // Validate all household IDs belong to the user
  if (!householdIds.every((id) => userHouseholdIds.includes(id))) {
    throw new Error('Invalid household for one or more bills');
  }

  const result = await db.transaction(async (tx) => {
    const updated = [];
    for (let i = 0; i < ids.length; i++) {
      const rows = await tx
        .update(schema.bills)
        .set({
          billName: names[i],
          householdId: householdIds[i],
          dueDate: dueDates[i],
          amount: amounts[i],
        })
        .where(
          and(
            eq(schema.bills.id, ids[i]),
            inArray(schema.bills.householdId, userHouseholdIds),
          ),
        )
        .returning();
      updated.push(...rows);
    }
    return updated;
  });

  getUserBills().refresh();
  getUserHouseholdBills().refresh();

  return { updatedBills: result, updatedCount: result.length };
});

const deleteBillsValidator = type({
  'bill-id[]': 'string[]',
});

/**
 * Deletes one or more bills.
 */
export const deleteBills = form(deleteBillsValidator, async (data) => {
  const userHouseholds = await getUserHouseholds();
  const billIds = [...new Set(data['bill-id[]'])];

  if (billIds.length === 0) {
    throw new Error('No bill IDs provided');
  }

  const deleted = await db
    .delete(schema.bills)
    .where(
      and(
        inArray(schema.bills.id, billIds),
        inArray(
          schema.bills.householdId,
          userHouseholds.map((h) => h.id),
        ),
      ),
    )
    .returning();

  getUserBills().refresh();
  getUserHouseholdBills().refresh();

  return { deletedBills: deleted, deletedCount: deleted.length };
});
