import { db } from '$lib/server/db';
import { exportedSchema as schema } from '@sungmanito/db';
import { eq, inArray, sql } from 'drizzle-orm';

export interface UpcomingBill {
  id: string;
  billName: string;
  amount: number;
  currency: string;
  /** The resolved calendar date this occurrence of the bill is due. */
  dueDate: Date;
}

const REMINDER_WINDOW_DAYS = 3;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function ymd(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * Resolves the next occurrence of a day-of-month due date on or after `from`.
 * Bills only carry a day-of-month (1-28), so a due date earlier in the month
 * than `from` has already happened this month and rolls over to next month
 * (e.g. dueDate=2 with from=Jan 31 resolves to Feb 2, not the already-passed Jan 2).
 */
export function resolveNextDueDate(dueDate: number, from: Date): Date {
  const fromDay = startOfDay(from);
  const thisMonth = new Date(from.getFullYear(), from.getMonth(), dueDate);
  if (thisMonth >= fromDay) return thisMonth;
  return new Date(from.getFullYear(), from.getMonth() + 1, dueDate);
}

/**
 * Every unpaid, not-yet-reminded bill due in the next `REMINDER_WINDOW_DAYS`
 * days, across every household (unscoped - this runs from a cron trigger,
 * not a user session).
 */
export async function getUpcomingUnpaidBillsByHousehold(
  now: Date = new Date(),
): Promise<
  Record<
    string,
    { householdName: string; memberEmails: string[]; bills: UpcomingBill[] }
  >
> {
  const windowStart = startOfDay(now);
  const windowEnd = new Date(windowStart);
  windowEnd.setDate(windowEnd.getDate() + REMINDER_WINDOW_DAYS);

  const bills = await db
    .select({
      id: schema.bills.id,
      billName: schema.bills.billName,
      amount: schema.bills.amount,
      currency: schema.bills.currency,
      dueDate: schema.bills.dueDate,
      householdId: schema.bills.householdId,
      householdName: schema.households.name,
    })
    .from(schema.bills)
    .innerJoin(
      schema.households,
      eq(schema.households.id, schema.bills.householdId),
    );

  const upcoming = bills
    .map((bill) => ({
      ...bill,
      resolvedDueDate: resolveNextDueDate(bill.dueDate, now),
    }))
    .filter(
      (bill) =>
        bill.resolvedDueDate >= windowStart && bill.resolvedDueDate < windowEnd,
    );

  if (upcoming.length === 0) return {};

  const billIds = upcoming.map((bill) => bill.id);
  const householdIds = [...new Set(upcoming.map((bill) => bill.householdId))];

  const [payments, reminders, members] = await Promise.all([
    db
      .select({
        billId: schema.payments.billId,
        paidAt: schema.payments.paidAt,
        forMonthKey: sql<string>`to_char(${schema.payments.forMonthD}, 'YYYY-MM-DD')`,
      })
      .from(schema.payments)
      .where(inArray(schema.payments.billId, billIds)),
    db
      .select({
        billId: schema.billReminders.billId,
        forMonthKey: sql<string>`to_char(${schema.billReminders.forMonthD}, 'YYYY-MM-DD')`,
      })
      .from(schema.billReminders)
      .where(inArray(schema.billReminders.billId, billIds)),
    db
      .select({
        householdId: schema.usersToHouseholds.householdId,
        email: schema.users.email,
      })
      .from(schema.usersToHouseholds)
      .innerJoin(
        schema.users,
        eq(schema.users.id, schema.usersToHouseholds.userId),
      )
      .where(inArray(schema.usersToHouseholds.householdId, householdIds)),
  ]);

  const excludedKeys = new Set<string>();
  for (const payment of payments) {
    if (payment.paidAt)
      excludedKeys.add(`${payment.billId}|${payment.forMonthKey}`);
  }
  for (const reminder of reminders) {
    excludedKeys.add(`${reminder.billId}|${reminder.forMonthKey}`);
  }

  const memberEmailsByHousehold = new Map<string, string[]>();
  for (const member of members) {
    const list = memberEmailsByHousehold.get(member.householdId) ?? [];
    list.push(member.email);
    memberEmailsByHousehold.set(member.householdId, list);
  }

  const result: Record<
    string,
    { householdName: string; memberEmails: string[]; bills: UpcomingBill[] }
  > = {};

  for (const bill of upcoming) {
    if (excludedKeys.has(`${bill.id}|${ymd(bill.resolvedDueDate)}`)) continue;

    if (!result[bill.householdId]) {
      result[bill.householdId] = {
        householdName: bill.householdName,
        memberEmails: memberEmailsByHousehold.get(bill.householdId) ?? [],
        bills: [],
      };
    }

    result[bill.householdId].bills.push({
      id: bill.id,
      billName: bill.billName,
      amount: bill.amount,
      currency: bill.currency,
      dueDate: bill.resolvedDueDate,
    });
  }

  return result;
}
