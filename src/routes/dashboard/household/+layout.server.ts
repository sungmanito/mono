import { householdsToUsersMap } from '$lib/server/actions/households.actions';
import { sql, eq, inArray } from 'drizzle-orm';
import { db, schema } from '$lib/server/db';
import { validateUserSession } from '$lib/util/session.js';
import { error } from '@sveltejs/kit';

// These can be deleted, i wasn't aware of the `parent()` function you could load in

export const load = async ({ locals }) => {
  const session = await locals.getSession();

  if (!validateUserSession(session)) error(401);

  const households = await db
    .select({
      id: schema.households.id,
      name: schema.households.name,
      ownerId: schema.households.ownerId,
      billCount: sql<number>`count(${schema.bills.id})::integer as bill_count`,
    })
    .from(schema.households)
    .leftJoin(schema.bills, eq(schema.bills.householdId, schema.households.id))
    .groupBy(schema.households.id)
    .orderBy(schema.households.name)
    .having(
      inArray(
        schema.households.id,
        locals.userHouseholds.map((h) => h.households.id),
      ),
    );

  return {
    households,
    streamable: {
      userHouseholds: householdsToUsersMap(
        locals.userHouseholds.map((h) => h.households.id),
      ),
    },
  };
};
