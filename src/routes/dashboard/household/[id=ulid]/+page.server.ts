import { db } from '$lib/server/db/client.js';
import { schema } from '$lib/server/db/index.js';
import { formDataValidObject } from '$lib/util/formData.js';
import { validateUserSession } from '$lib/util/session.js';
import { error, redirect } from '@sveltejs/kit';
import { eq, like, or, sql } from 'drizzle-orm';
import { type } from 'arktype';

const formDataValidator = type({
  user: 'email | string',
});

export const load = async ({ params, locals }) => {

  const session = await locals.getSession();

  if (!validateUserSession(session)) throw redirect(300, '/login');

  const household = await db.query.households.findFirst({
    where: ({ id }, { eq, and, inArray }) => and(eq(id, params.id), inArray(id, locals.userHouseholds.map(h => h.households.id))),
    
  });

  if (!household) {
    throw redirect(303, 'Nope');
  }

  return {
    // Current household info
    household,
    // Not 100% i need this anymore, but we'll leave it in for now.
    user: session.user,
    streamed: {
      // The bills for the current household
      bills: db.select()
        .from(schema.bills)
        .where(eq(schema.bills.householdId, household.id)),
      // Invites for the current household
      invites: db.select()
        .from(schema.invites)
        .where(eq(schema.invites.householdId, household.id))

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
     * 1. Validate form data
     * 2. Find any users already in the system
     * 3. Invite any others by email
    */
   if (!validateUserSession(session)) throw error(401);

   const formData = formDataValidObject(await request.formData(), type({emails: 'string'}));
   console.info('formData', formData);
   const emails = formData.emails.split(/\n|,\s?/g);
   console.info(emails);

    return {};
  },
  updateHousehold: async ({ request, locals }) => {
    const session = await locals.getSession();
    if(!validateUserSession(session)) throw error(401);
    const formData = await request.formData();
    console.info(formData);
    return {}
  },
}