import { db, schema } from '$lib/server/db';
import { and, eq, inArray, sql } from 'drizzle-orm';

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

// export async function updateHousehold(householdId: string, data: Partial<Omit<Household, 'id'>>) {
//   return {};
// }

export async function deleteHousehold(householdId: string) {
  const household = await db.query.households.findFirst({
    with: {
      users: true,
    },
    where: ({ id }, { eq }) => eq(id, householdId)
  });
  return household;
}

type UserMapped = {
  id: string;
  isOwner: boolean;
  email: string;
  userMetadata: typeof schema.users.$inferSelect['userMetadata'];
}

export async function householdsToUsersMap(households: Household['id'][]) {
  return db.select({
    id: schema.users.id,
    email: schema.users.email,
    userMetadata: schema.users.userMetadata,
    householdId: schema.usersToHouseholds.householdId,
    householdName: schema.households.name,
    isOwner: sql<boolean>`${schema.households.ownerId} = ${schema.users.id}`
  })
    .from(schema.users)
    .innerJoin(
      schema.usersToHouseholds,
      and(
        inArray(schema.usersToHouseholds.householdId, households),
        eq(schema.usersToHouseholds.userId, schema.users.id)
      )
    ).innerJoin(
      schema.households,
      eq(schema.households.id, schema.usersToHouseholds.householdId)
    )
    .then(rows => {
      const map = rows.reduce((all, cur) => {
        if(!all[cur.householdId]) all[cur.householdId] = {
          householdId: cur.householdId,
          householdName: cur.householdName,
          users: []
        };
        all[cur.householdId].users.push({
          id: cur.id,
          isOwner: cur.isOwner,
          email: cur.email,
          userMetadata: cur.userMetadata,
        });
        return all
      }, {} as Record<string, {householdId: string; householdName: string; users: UserMapped[]; }>);
      return map;
    })
}