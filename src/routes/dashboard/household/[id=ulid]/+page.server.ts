import { db } from '$lib/server/db/client.js';
import { schema } from '$lib/server/db/index.js';
import { formDataToObject } from '$lib/util/formData.js';
import { validateUserSession } from '$lib/util/session.js';
import { error, redirect } from '@sveltejs/kit';
import { and, eq, ilike, inArray, like, or, sql } from 'drizzle-orm';

type ArrayType<T> = T extends (infer U)[] ? U : never;

export const load = async ({ params, locals }) => {

  const session = await locals.getSession();

  if(!validateUserSession(session)) throw redirect(300, '/login');

  const household = await db.query.households.findFirst({
    where: ({ id }, { eq, and, inArray }) => and(eq(id, params.id), inArray(id, locals.userHouseholds.map(h => h.households.id))),
    with: {
      users: {
        with: {
          user: true
        }
      },
    }
  });

  if (!household) {
    throw redirect(303, 'Nope');
  }
  
  return {
    household,
    households: locals.userHouseholds,
    user: session.user,
    streamed: {
      householdUsers: db.select({
        id: schema.users.id,
        email: schema.users.email,
        userMetadata: schema.users.userMetadata,
        householdId: schema.usersToHouseholds.householdId
      })
        .from(schema.users)
        .innerJoin(schema.usersToHouseholds, and(
          inArray(
            schema.usersToHouseholds.householdId,
            locals.userHouseholds.map(h => h.households.id)
          ),
          eq(schema.usersToHouseholds.userId, schema.users.id)
        )
      ).then(r => {
        const map = r.reduce((all, cur) => {
          if(!all[cur.householdId])
            all[cur.householdId] = [];
          all[cur.householdId].push(cur)
          return all;
        }, {} as Record<string, ArrayType<typeof r>[]>);
        return map;
      }),
      bills: db.select()
        .from(schema.bills)
        .where(eq(schema.bills.householdId, household.id))
          
    }
  };
};

export const actions = {
  findUser: async ({ request, locals }) => {
    const session = await locals.getSession();

    if(!validateUserSession(session)) throw error(401, 'Not logged in');

    const formData = formDataToObject(await request.formData());

    const b = await db.select().from(schema.users)
      .where(
        or(
          sql`${schema.users.userMetadata}->>'name' ilike ${'%'+formData.user+'%'}`,
          like(schema.users.email, `%${formData.user as string}%`)
        )
      );

    console.info('JIM', b)

    return {
      users: b
    }
  }
}