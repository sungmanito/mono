import { db, schema } from '$lib/server/db';
import { and, eq } from 'drizzle-orm';

export type Household = typeof schema.households.$inferSelect;
export type HouseholdInsertArgs = typeof schema.households.$inferInsert;

export async function getUserHouseholds(userId: string) {
  return db
    .select()
    .from(schema.households)
    .innerJoin(
      schema.usersToHouseholds,
      and(
        eq(schema.households.id, schema.usersToHouseholds.householdId),
      )
    )
    .where(eq(schema.usersToHouseholds.userId, userId));
}

export async function addHousehold(household: HouseholdInsertArgs) {

  const [returnedHousehold] = await db.insert(schema.households).values(household);
  return returnedHousehold;
}

export async function updateHousehold(householdId: string, data: Partial<Omit<Household, 'id'>>) {
  return {};
}

export async function deleteHousehold(householdId: string) {
  const household = await db.query.households.findFirst({
    with: {
      users: true,
    },
    where: ({ id }, { eq }) => eq(id, householdId)
  });
  return household;
}