import { query, form, command } from '$app/server';
import { db } from '$lib/server/db';
import { exportedSchema as schema } from '@sungmanito/db';
import { and, eq, getTableColumns } from 'drizzle-orm';
import { getUser } from './common.remote';
import { type } from 'arktype';
import { ulid } from 'ulidx';

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

export type billValidator = {};

export const createOrUpdateBill = command(
  type({
    'id?': ulid,
  }),
  async () => {},
);
