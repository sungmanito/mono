import { db, schema } from '$lib/server/db';
import { households } from '$lib/server/db/schema/households.table.js';
import { usersToHouseholds } from '$lib/server/db/schema/usersToHouseholds.table.js';
import { formDataValidObject } from '$lib/util/formData.js';
import { validateUserSession } from '$lib/util/session.js';
import { error, fail, redirect } from '@sveltejs/kit';
import { type } from 'arktype';
import { and, eq } from 'drizzle-orm';
import { ulid } from 'ulidx';

export const load = async ({ locals }) => {
  const session = await locals.getSession();
  if(!validateUserSession(session)) redirect(303, '/login');

  return {
    streamed: {
      invites: db.select()
        .from(schema.invites)
        .innerJoin(schema.households, eq(schema.households.id, schema.invites.householdId))
        .where(eq(schema.invites.toId, session.user.id))
    }
  }
}

export const actions = {
  updateInvite: async ({ request, locals }) => {
    const session = await locals.getSession();
    if(!validateUserSession(session)) error(401);
    const formData = formDataValidObject(await request.formData(), type({ 'invite-id': 'string', action: "'accept'|'delete'"}));
    console.info(formData);
    if(formData.action === 'accept') {
      const response = await db.transaction(async tx => {
        const [inv] = await tx.select()
          .from(schema.invites)
          .where(
            and(
              eq(schema.invites.id, formData['invite-id']),
              eq(schema.invites.toId, session.user.id)
            )
          );

        if(!inv) {
          tx.rollback();
          return null;
        }

        await tx.insert(schema.usersToHouseholds).values({
          userId: session.user.id,
          householdId: inv.householdId,
        });
        const [deleted] = await tx.delete(schema.invites).where(eq(schema.invites.id, inv.id)).returning();
        return {
          invite: deleted,
        }
      });
      return {
        invite: response?.invite
      }
    } else {
      const [response] = await db.delete(schema.invites)
        .where(
          and(
            eq(schema.invites.id, formData['invite-id']),
            eq(schema.invites.toId, session.user.id),
          )
        ).returning();

      if(!response) error(400, 'Could not resolve invite');

    }
    return {}
  },
  addHousehold: async ({ request, locals }) => {
    const session = await locals.getSession();
    const data = await request.formData();

    if(data.has('household-name') && validateUserSession(session)) {
      const [household] = await db.insert(households).values({
        id: ulid(),
        name: data.get('household-name') as string,
        ownerId: session.user.id
      }).returning();

      await db.insert(usersToHouseholds).values({
        userId: session.user.id,
        householdId: household.id,
      });

      return {
        success: true,
        type: 'add-household',
        household,
      }
    }

    return {
      success: false,
    }
  },
  deleteHousehold: async ({ request, locals }) => {
    const session = await locals.getSession();
    const data = await request.formData();

    if(!session) {
      return {
        success: false,
        type: 'delete-household',
        code: 401,
      }
    }

    const householdId = data.get('household-id');

    // Need this to run correctly.
    if(!householdId || typeof householdId !== 'string') {
      return {
        success: false,
        type: 'delete-household',
        code: 400,
      }
    }

    const household = await db.query.households.findFirst({
      where(fields, operators) {
        return operators.eq(fields.id, householdId);
      },
      with: {
        users: true,
      }
    });
    
    // Can only delete households with 1 member.

    if(household && household.users.length && household.users.every(v => v.userId === session.user.id)) {
      const response = await db.delete(households).where(eq(households.id, householdId)).returning();
      console.info('RESPONSE', response);
    } else {
      console.error('nope');
    }

    return {
      success: true,
      type: 'delete-household',
      code: 200,
    };    
  },
  updateHousehold: async ({ locals, request }) => {
    const data = await request.formData();
    const householdId = data.get('household-id');

    // Bail
    if(!householdId || typeof householdId !== 'string') {
      return {
        success: false,
        code: 400,
        type: 'update-household',
      };
    }

    const newName = data.get('household-name');

    if(!newName || typeof newName !== 'string') {
      return {
        success: false,
        code: 400,
        type: 'update-household'
      };
    }

    return fail(401);

    const values = await db
      .update(households)
      .set({
        name: newName,
      })
      .where(eq(households.id, householdId))
      .returning();

    if(values) {
      return {
        success: true,
        code: 201,
        type: 'update-household'
      }
    }

    return {
      success: false,
      code: 400,
      type: 'update-household'
    }
  }
};
