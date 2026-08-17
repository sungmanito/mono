import { query, form } from '$app/server';
import { db } from '$lib/server/db';
import { exportedSchema as schema } from '@sungmanito/db';
import { and, asc, eq, getTableColumns, inArray, sql } from 'drizzle-orm';
import { getUser, getUserHouseholds } from './common.remote';
import { getUserHouseholdBills } from './dashboard.remote';
import { type } from 'arktype';
import { optionalISODateValidator, ulidValidator } from '$lib/typesValidators';

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
 * Fetches all of the current user's bills joined with their payment status
 * for the given month (defaults to the current month), grouped by household.
 * A bill with no payment row yet for the month is "upcoming" (or "overdue"
 * once its due date has passed) rather than being excluded.
 */
export const getUserBillsWithPaymentStatus = query(
  optionalISODateValidator,
  async (date) => {
    const user = await getUser();
    const targetDate = date ? new Date(date) : new Date();
    const month = targetDate.getUTCMonth() + 1;
    const year = targetDate.getUTCFullYear();

    const rows = await db
      .select({
        ...getTableColumns(schema.bills),
        householdName: schema.households.name,
        payment: schema.payments,
        status: sql<
          'overdue' | 'upcoming' | 'paid'
        >`case when ${schema.payments.paidAt} is not null then 'paid'::text when make_date(${year}, ${month}, ${schema.bills.dueDate}) < now() then 'overdue'::text else 'upcoming'::text end`,
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
          eq(sql`extract('month' from ${schema.payments.forMonthD})`, month),
          eq(sql`extract('year' from ${schema.payments.forMonthD})`, year),
          eq(schema.payments.billId, schema.bills.id),
        ),
      )
      .orderBy(asc(schema.bills.dueDate));

    return rows.reduce(
      (acc, row) => {
        if (!acc[row.householdId]) {
          acc[row.householdId] = { name: row.householdName, bills: [] };
        }
        acc[row.householdId].bills.push(row);
        return acc;
      },
      {} as Record<string, { name: string; bills: typeof rows }>,
    );
  },
);

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
      where: (fields, { eq, and, inArray }) =>
        and(
          eq(fields.billId, id),
          inArray(
            fields.householdId,
            userHouseholds.map((h) => h.id),
          ),
        ),
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
  name: 'string[]',
  householdId: ulidValidator.array(),
  dueDate: 'string.numeric.parse[]',
  amount: 'string.numeric.parse[]',
  currency: 'string[]',
});

/**
 * Creates one or more bills with an initial payment for the current month.
 */
export const createBill = form(billCreateValidator, async (data) => {
  const userHouseholds = await getUserHouseholds();
  const householdIds = userHouseholds.map((h) => h.id);

  const names = data['name'];
  const householdIdsInput = data['householdId'];
  const dueDates = data['dueDate'];
  const amounts = data['amount'];
  const currencies = data['currency'];

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
  getUserBillsWithPaymentStatus().refresh();

  return bills;
});

const billUpdateValidator = type({
  billId: 'string',
  billName: 'string',
  householdId: 'string',
  dueDate: 'string',
  'amount?': 'string',
  'currency?': 'string',
});

/**
 * Updates a single bill.
 */
export const updateBill = form(billUpdateValidator, async (data) => {
  const userHouseholds = await getUserHouseholds();

  if (!userHouseholds.some((h) => h.id === data['householdId'])) {
    throw new Error('Not authorized to update this bill');
  }

  const dueDate = Number(data['dueDate']);
  if (dueDate < 1 || dueDate > 28) {
    throw new Error('Due date must be between 1 and 28');
  }

  const [updated] = await db
    .update(schema.bills)
    .set({
      billName: data['billName'],
      dueDate,
      householdId: data['householdId'],
      amount: data['amount'] ? Number(data['amount']) : undefined,
      currency: data['currency'] ? data['currency'].toUpperCase() : undefined,
    })
    .where(
      and(
        eq(schema.bills.id, data['billId']),
        inArray(
          schema.bills.householdId,
          userHouseholds.map((h) => h.id),
        ),
      ),
    )
    .returning();

  getUserBills().refresh();
  getUserHouseholdBills().refresh();
  getUserBillsWithPaymentStatus().refresh();
  if (updated) getBill(updated.id).refresh();

  return updated;
});

const billsBatchUpdateValidator = type({
  billsId: 'string[]',
  billsName: 'string[]',
  billsHouseholdId: 'string[]',
  billsDueDate: 'string[]',
  billsAmount: 'string[]',
});

/**
 * Batch-updates multiple bills.
 */
export const updateBills = form(billsBatchUpdateValidator, async (data) => {
  const userHouseholds = await getUserHouseholds();
  const userHouseholdIds = userHouseholds.map((h) => h.id);

  const ids = data['billsId'];
  const names = data['billsName'];
  const householdIds = data['billsHouseholdId'];
  const dueDates = data['billsDueDate'].map(Number);
  const amounts = data['billsAmount'].map(Number);

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
  getUserBillsWithPaymentStatus().refresh();

  return { updatedBills: result, updatedCount: result.length };
});

const deleteBillsValidator = type({
  billId: 'string[]',
});

/**
 * Deletes one or more bills.
 */
export const deleteBills = form(deleteBillsValidator, async (data) => {
  const userHouseholds = await getUserHouseholds();
  const billIds = [...new Set(data['billId'])];

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
  getUserBillsWithPaymentStatus().refresh();

  return { deletedBills: deleted, deletedCount: deleted.length };
});
