import { inviteMembersByEmail } from '$lib/server/actions/invites.action.js';
import { db, schema } from '$lib/server/db';
import { households } from '$lib/server/db/schema/households.table.js';
import { formDataValidObject } from '$lib/util/formData.js';
import { validateUserSession } from '$lib/util/session.js';
import { error, fail, redirect } from '@sveltejs/kit';
import { type } from 'arktype';
import { and, eq, inArray, sql } from 'drizzle-orm';

export const load = async ({ locals }) => {
  const session = await locals.getSession();
  if (!validateUserSession(session)) throw redirect(303, '/login');

  return {
    streamed: {
      invites: db
        .select()
        .from(schema.invites)
        .innerJoin(
          schema.households,
          eq(schema.households.id, schema.invites.householdId),
        )
        .where(eq(schema.invites.toId, session.user.id)),
    },
  };
};

export const actions = {
  updateInvite: async ({ request, locals }) => {
    const session = await locals.getSession();
    if (!validateUserSession(session)) throw error(401);
    const formData = formDataValidObject(
      await request.formData(),
      type({ 'invite-id': 'string', action: "'accept'|'delete'" }),
    );
    console.info(formData);
    if (formData.action === 'accept') {
      const response = await db.transaction(async (tx) => {
        const [inv] = await tx
          .select()
          .from(schema.invites)
          .where(
            and(
              eq(schema.invites.id, formData['invite-id']),
              eq(schema.invites.toId, session.user.id),
            ),
          );

        if (!inv) {
          tx.rollback();
          return null;
        }

        await tx.insert(schema.usersToHouseholds).values({
          userId: session.user.id,
          householdId: inv.householdId,
        });
        const [deleted] = await tx
          .delete(schema.invites)
          .where(eq(schema.invites.id, inv.id))
          .returning();
        return {
          invite: deleted,
        };
      });
      return {
        invite: response?.invite,
      };
    } else {
      const [response] = await db
        .delete(schema.invites)
        .where(
          and(
            eq(schema.invites.id, formData['invite-id']),
            eq(schema.invites.toId, session.user.id),
          ),
        )
        .returning();

      if (!response) throw error(400, 'Could not resolve invite');
    }
    return {};
  },
  addHousehold: async ({ request, locals }) => {
    const session = await locals.getSession();
    if (!validateUserSession(session)) throw error(400);

    const data = formDataValidObject(
      await request.formData(),
      type({
        'household-name': 'string',
        'members?': 'email[] | email',
      }),
    );

    const members = Array.isArray(data.members)
      ? data.members
      : !data.members
        ? []
        : [data.members];

    const [household] = await db
      .insert(schema.households)
      .values({
        name: data['household-name'],
        ownerId: session.user.id,
      })
      .returning();

    if (!household) throw error(400);

    const responses = await inviteMembersByEmail(
      locals.supabase,
      members,
      household.id,
      {
        fromEmail: session.user.email as string,
        fromId: session.user.id,
      },
    );

    return {
      success: false,
      invites: responses,
    };
  },
  deleteHousehold: async ({ request, locals }) => {
    const session = await locals.getSession();

    if (!validateUserSession(session)) throw error(401);

    const data = formDataValidObject(
      await request.formData(),
      type({
        'household-id': 'string',
      }),
    );

    const deleted = await db.transaction(async (tx) => {
      // This could be moved to just a straight forward delete with an `and` in the where clause
      // Not 100% why I did it this way...
      const [{ isOwner }] = await tx
        .select({
          isOwner: sql<boolean>`${schema.households.ownerId} = ${session.user.id}`,
        })
        .from(schema.households)
        .where(eq(schema.households.id, data['household-id']));

      if (!isOwner) {
        tx.rollback();
        return false;
      }

      const [item] = await tx
        .delete(schema.households)
        .where(eq(schema.households.id, data['household-id']))
        .returning();

      return Boolean(item);
    });

    if (!deleted) throw error(422);

    return {
      success: true,
    };
  },
  updateHousehold: async ({ locals, request }) => {
    const session = await locals.getSession();

    if (!validateUserSession(session)) throw error(401, 'nope');

    const data = formDataValidObject(
      await request.formData(),
      type({
        'household-id': 'string',
        name: 'string>=2',
      }),
    );

    if (
      locals.userHouseholds.findIndex(
        (h) => h.households.id === data['household-id'],
      ) === -1
    )
      throw error(401, 'Not authorized');

    const [returned] = await db
      .update(households)
      .set({
        name: data.name,
      })
      .where(eq(households.id, data['household-id']))
      .returning();

    return {
      household: returned,
    };
  },
};
