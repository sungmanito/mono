import { deleteHousehold } from '$lib/server/actions/households.actions.js';
import { db } from '$lib/server/db';
import { households } from '$lib/server/db/schema/households.table.js';
import { usersToHouseholds } from '$lib/server/db/schema/usersToHouseholds.table.js';
import { fail } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { ulid } from 'ulidx';

export const load = async ({ locals }) => {
  const { data: { user }, error } = await locals.supabase.auth.getUser();

  if(error || !user ) {
    return { households: []}
  }

  const householdsValue = await db.query.usersToHouseholds.findMany({
    where: ({ userId }, { eq }) => eq(userId, user.id),
    with: {
      household: {
        with: {
          users: true,
          bills: true,
        }
      },
    }
  })
    .then(r => r.map(v => v.household )).catch(e => {
      console.error(e);
      return [];
    });

  return {
    households: householdsValue,
  };
}

export const actions = {
  addHousehold: async ({ request, locals }) => {
    const session = await locals.getSession();
    const data = await request.formData();

    if(data.has('household-name') && session && session.user) {
      const [household] = await db.insert(households).values({
        id: ulid(),
        name: data.get('household-name') as string
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
