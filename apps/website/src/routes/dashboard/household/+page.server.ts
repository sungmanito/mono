import { addHousehold } from '$lib/server/actions/households.actions.js';
import { inviteMembersByEmail } from '$lib/server/actions/invites.action.js';
import { db } from '$lib/server/db';
import { validateFormData } from '@jhecht/arktype-utils';
import { validateUserSession } from '$lib/util/session.js';
import { exportedSchema as schema } from '@sungmanito/db';
import { error, redirect } from '@sveltejs/kit';
import { type } from 'arktype';
import { and, eq, sql, inArray, asc } from 'drizzle-orm';

export const load = async ({ locals }) => {
  const session = await locals.getSession();
  if (!validateUserSession(session)) redirect(303, '/login');

  // We're gonna grab a lot of data

  return {
    bills: db
      .select()
      .from(schema.bills)
      .where(
        inArray(
          schema.bills.householdId,
          locals.userHouseholds.map((h) => h.households.id),
        ),
      )
      .orderBy(asc(schema.bills.dueDate), asc(schema.bills.billName))
      .then((raw) => {
        return raw.reduce(
          (all, cur) => {
            if (!all[cur.householdId]) all[cur.householdId] = [cur];
            else all[cur.householdId].push(cur);
            return all;
          },
          {} as Record<string, (typeof raw)[number][]>,
        );
      }),
  };
};

export const actions = {
  updateInvite: async ({ request, locals }) => {
    const session = await locals.getSession();
    if (!validateUserSession(session)) error(401);
    const formData = validateFormData(
      await request.formData(),
      // eslint-disable-next-line quotes
      type({ 'invite-id': 'string', action: "'accept'|'delete'" }),
    );

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

      if (!response) error(400, 'Could not resolve invite');
    }
    return {};
  },
  addHousehold: async ({ request, locals }) => {
    const session = await locals.getSession();
    if (!validateUserSession(session)) throw error(400);

    const data = validateFormData(
      await request.formData(),
      type({
        'household-name': 'string',
        'members?': 'string.email[]',
      }),
    );

    const members = Array.isArray(data.members)
      ? data.members
      : !data.members
        ? []
        : [data.members];

    const household = await addHousehold({
      name: data['household-name'],
      ownerId: session.user.id,
    });

    if (household === null) throw error(400);

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

    if (!validateUserSession(session)) error(401);

    const data = validateFormData(
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

    if (!deleted) error(422);

    return {
      success: true,
    };
  },
  updateHousehold: async ({ locals, request }) => {
    const session = await locals.getSession();

    if (!validateUserSession(session)) error(401, 'nope');

    const data = validateFormData(
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
      error(401, 'Not authorized');

    const [returned] = await db
      .update(schema.households)
      .set({
        name: data.name,
      })
      .where(eq(schema.households.id, data['household-id']))
      .returning();

    return {
      household: returned,
    };
  },
};
