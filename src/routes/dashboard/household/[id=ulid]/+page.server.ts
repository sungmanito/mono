import { db } from '$lib/server/db/client.js';
import { schema } from '$lib/server/db/index.js';
import { formDataValidObject } from '$lib/util/formData.js';
import { validateUserSession } from '$lib/util/session.js';
import { error, redirect } from '@sveltejs/kit';
import { eq, inArray, like, or, sql } from 'drizzle-orm';
import { type } from 'arktype';
import { isValid } from 'ulidx';

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
  findUser: async ({ request, locals, url }) => {
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
  inviteUsers: async ({ request, locals, url }) => {
    const session = await locals.getSession();
    /**
     * 1. Validate form data
     * 2. Find any users already in the system
     * 3. Invite any others by email
    */
    if (!validateUserSession(session)) throw error(401);

    const formData = formDataValidObject(await request.formData(), type({ emails: 'string', 'household-id': 'string' }));
    if(!isValid(formData['household-id'])) throw error(400);
    const emailsTmp = formData.emails.split(/\r?\n|,\s?/g);
    const { data: emails, problems } = type({ emails: 'email[]' })({ emails: emailsTmp });

    console.info(emails, problems);

    if (!emails) throw error(400);

    // Alright now the fun part... we have to send these emails out...

    const alreadyInSystem = await db.select({
      id: schema.users.id,
      email: schema.users.email
    })
      .from(schema.users)
      .where(inArray(schema.users.email, emails.emails))
      .then(r => {
        return r.reduce((all, cur) => {
          all[cur.email] = cur.id;
          return all
        }, {} as Record<string, string>)
      });

    const allInvites = await db.transaction(async tx => {
      // TODO: clean this up a bit.
      const invites: (typeof schema.invites.$inferSelect)[] = [];
      for (const email of emails.emails) {
        let id: string = '';
        if (alreadyInSystem[email]) id = alreadyInSystem[email];

        // If we do not have an id, then we must invite this person
        if (!id) {
          const { data: { user }, error: inviteError } = await locals.supabase.auth.admin.inviteUserByEmail(email, {
            redirectTo: `${url.protocol}//${url.host}/register`
          });
          // We need the IDS in order to set things up later, so it's best to have them
          // or to fail
          if (inviteError || !user) {
            await tx.rollback();
            return;
          }
          id = user.id
        }

        // Grab the response object
        const [resp] = await db.insert(schema.invites).values({
          fromEmail: session.user.email as string,
          toEmail: email,
          householdId: formData['household-id'],
          fromId: session.user.id,
          toId: id,
        }).returning();

        // if we don't get a response, roll that shit back
        if(!resp) {
          await tx.rollback();
          return;
        }

        // Push info into the invites array
        invites.push(resp);

      }
      return invites;
    });

    return {
      invites: allInvites
    };
  },
  updateHousehold: async ({ request, locals }) => {
    const session = await locals.getSession();
    if (!validateUserSession(session)) throw error(401);
    const formData = await request.formData();
    console.info(formData);
    return {}
  },
}