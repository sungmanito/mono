import { db } from '$lib/server/db/client.js';
import { formDataValidObject, validateFormData } from '$lib/util/formData.js';
import { validateUserSession } from '$lib/util/session.js';
import { exportedSchema as schema } from '@sungmanito/db';
import { error, redirect } from '@sveltejs/kit';
import { type } from 'arktype';
import { and, eq, inArray, like, or, sql } from 'drizzle-orm';

const formDataValidator = type({
  user: 'email | string',
});

export const load = async ({ params, locals, depends }) => {
  const session = await locals.getSession();
  depends('user:households');

  if (!validateUserSession(session)) redirect(300, '/login');

  const household = await db.query.households.findFirst({
    where: ({ id }, { eq, and, inArray }) =>
      and(
        eq(id, params.id),
        inArray(
          id,
          locals.userHouseholds.map((h) => h.households.id),
        ),
      ),
  });

  if (!household) {
    redirect(303, 'Nope');
  }

  return {
    // Current household info
    household,
    // Not 100% i need this anymore, but we'll leave it in for now.
    // user: session.user,
    streamed: {
      // The bills for the current household
      bills: db.query.bills.findMany({
        with: {
          payments: {
            orderBy(fields, operators) {
              return operators.desc(fields.createdAt);
            },
            limit: 1,
          },
        },
        where(fields, operators) {
          return operators.eq(fields.householdId, household.id);
        },
      }),
      // Invites for the current household
      invites: db
        .select()
        .from(schema.invites)
        .where(eq(schema.invites.householdId, household.id)),
    },
  };
};

export const actions = {
  findUser: async ({ request, locals }) => {
    const session = await locals.getSession();

    if (!validateUserSession(session)) error(401, 'Not logged in');

    try {
      const formData = formDataValidObject(
        await request.formData(),
        formDataValidator,
      );

      const b = await db
        .select()
        .from(schema.users)
        .where(
          or(
            // Check if the value is the user's name, or part of it
            sql`${schema.users.userMetadata}->>'name' ilike ${
              '%' + formData.user + '%'
            }`,
            // Check if the value is part of the user's email
            like(schema.users.email, `%${formData.user as string}%`),
            // Check if the value is the user's actual name
            eq(schema.users.email, formData.user as string),
          ),
        );

      return {
        users: b,
      };
    } catch (e) {
      console.error(e);
      error(400);
    }
  },
  removeMember: async ({ request, locals, params }) => {
    const session = await locals.getSession();
    if (!validateUserSession(session)) error(401);

    const formData = formDataValidObject(
      await request.formData(),
      type({
        userId: 'string',
      }),
    );

    const [household] = await db
      .select({ ownerId: schema.households.ownerId })
      .from(schema.households)
      .where(eq(schema.households.id, params.id));

    const { sessionUserIwOwner, sessionUserRemovingSelf } = {
      sessionUserIwOwner: session.user.id === household.ownerId,
      sessionUserRemovingSelf: session.user.id === formData.userId,
    };

    if (!(sessionUserIwOwner || sessionUserRemovingSelf)) error(400);
    if (!(sessionUserIwOwner || sessionUserRemovingSelf)) error(400);

    await db
      .delete(schema.usersToHouseholds)
      .where(
        and(
          eq(schema.usersToHouseholds.userId, formData.userId),
          eq(schema.usersToHouseholds.householdId, params.id),
        ),
      );

    return {
      success: true,
    };
  },
  inviteUsers: async ({ request, locals, url }) => {
    const session = await locals.getSession();
    /**
     * 1. Validate form data
     * 2. Find any users already in the system
     * 3. Invite any others by email
     */
    if (!validateUserSession(session)) error(401);

    const formData = validateFormData(
      await request.formData(),
      type({ emails: 'email[]', 'household-id': 'string' }),
    );

    // Have to filter out the issues to help solve #24
    formData.emails = formData.emails.filter(
      (email) => email != 'email@email.com',
    );

    // Alright now the fun part... we have to send these emails out...

    const alreadyInSystem = await db
      .select({
        id: schema.users.id,
        email: schema.users.email,
      })
      .from(schema.users)
      .where(inArray(schema.users.email, formData.emails))
      .then((r) => {
        return r.reduce(
          (all, cur) => {
            all[cur.email] = cur.id;
            return all;
          },
          {} as Record<string, string>,
        );
      });

    const allInvites = await db.transaction(async (tx) => {
      // TODO: clean this up a bit.
      const invites: (typeof schema.invites.$inferSelect)[] = [];
      for (const email of formData.emails) {
        let id: string = '';
        if (alreadyInSystem[email]) id = alreadyInSystem[email];

        // If we do not have an id, then we must invite this person
        if (!id) {
          const {
            data: { user },
            error: inviteError,
          } = await locals.supabase.auth.admin.inviteUserByEmail(email, {
            redirectTo: `${url.protocol}//${url.host}/login`,
          });
          // We need the IDS in order to set things up later, so it's best to have them
          // or to fail
          if (inviteError || !user) {
            await tx.rollback();
            return;
          }
          id = user.id;
        }

        // Grab the response object
        const [resp] = await db
          .insert(schema.invites)
          .values({
            fromEmail: session.user.email as string,
            toEmail: email,
            householdId: formData['household-id'],
            fromId: session.user.id,
            toId: id,
          })
          .returning();

        // if we don't get a response, roll that shit back
        if (!resp) {
          await tx.rollback();
          return;
        }

        // Push info into the invites array
        invites.push(resp);
      }
      return invites;
    });

    return {
      invites: allInvites,
    };
  },
  updateHousehold: async ({ request, locals }) => {
    const session = await locals.getSession();
    if (!validateUserSession(session)) error(401);
    const formData = await request.formData();
    console.info(formData);
    return {};
  },
  deleteInvite: async ({ request, locals }) => {
    const session = await locals.getSession();
    if (!validateUserSession(session)) error(401);
    const { 'invite-id': inviteId } = formDataValidObject(
      await request.formData(),
      type({ 'invite-id': 'string' }),
    );
    console.info('FORMDATA', inviteId);
    const [row] = await db
      .delete(schema.invites)
      .where(
        and(
          eq(schema.invites.id, inviteId),
          inArray(
            schema.invites.householdId,
            db
              .select({ id: schema.households.id })
              .from(schema.households)
              .where(eq(schema.households.ownerId, session.user.id)),
          ),
        ),
      )
      .returning();
    if (!row) error(500);
    return {
      deleted: row,
    };
  },
};
