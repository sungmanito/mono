import { db } from '$lib/server/db/client.js';
import { schema } from '$lib/server/db/index.js';
import { formDataValidObject } from '$lib/util/formData.js';
import { validateUserSession } from '$lib/util/session.js';
import { error, redirect } from '@sveltejs/kit';
import { and, eq, inArray, like, or, sql } from 'drizzle-orm';
import { type } from 'arktype';

type ArrayType<T> = T extends (infer U)[] ? U : never;

const formDataValidator = type({
  user: 'email | string',
});

export const load = async ({ params, locals }) => {

  const session = await locals.getSession();

  if (!validateUserSession(session)) throw redirect(300, '/login');

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
    // households: locals.userHouseholds,
    user: session.user,
    streamed: {
      bills: db.select()
        .from(schema.bills)
        .where(eq(schema.bills.householdId, household.id))

    }
  };
};

export const actions = {
  findUser: async ({ request, locals }) => {
    const session = await locals.getSession();

    if (!validateUserSession(session)) throw error(401, 'Not logged in');

    try {
      const formData = formDataValidObject(await request.formData(), formDataValidator);

      const b = await db.select().from(schema.users)
        .where(
          or(
            // Check if the value is the user's name, or part of it
            sql`${schema.users.userMetadata}->>'name' ilike ${'%' + formData.user + '%'}`,
            // Check if the value is part of the user's email
            like(schema.users.email, `%${formData.user as string}%`),
            // Check if the value is the user's actual name
            eq(schema.users.email, formData.user as string)
          )
        );

      return {
        users: b
      }
    } catch (e) {
      console.error(e)
      throw error(400);
    }
  },
  inviteUsers: async ({ request, locals }) => {
    const session = await locals.getSession();

    /**
     * 1. Invite a user. 
     */
    if(!validateUserSession(session)) throw error(401);

    return {};
  }
}