import { db } from '$lib/server/db';
import { validateUserSession } from '$lib/util/session.js';
import schema from '@sungmanito/db';
import { error } from '@sveltejs/kit';
import { eq, sql } from 'drizzle-orm';

export const load = async ({ locals, params }) => {
  // TODO: flesh this out fully.
  const session = await locals.getSession();

  if (!validateUserSession(session)) {
    throw error(401);
  }

  if (!params.id) throw error(400);

  const householdId = params.id;

  const user = db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      householdId: schema.usersToHouseholds.householdId,
      householdName: schema.households.name,
      isOwner: sql<boolean>`${schema.households.ownerId} = ${schema.users.id}`,
      name: sql`${schema.users.userMetadata} -> 'name'`,
    })
    .from(schema.users)
    .innerJoin(
      schema.usersToHouseholds,
      eq(schema.usersToHouseholds.userId, schema.users.id),
    )
    .innerJoin(
      schema.households,
      eq(schema.households.id, schema.usersToHouseholds.householdId),
    )
    .where(eq(schema.households.id, householdId));

  return {
    user,
  };
};
