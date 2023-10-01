import { db } from '$lib/server/db';

export const load = async ({ locals }) => {
  const session = await locals.getSession();

  if(session?.user && session.user.id) {

    const bob = await db.query.Households.findMany({
      with: {
        users: {
          where(fields, operators) {
            return operators.eq(fields.userId, session.user.id)
          },
        }
      }
    })

    
    console.info(JSON.stringify(bob, null, 2));
    return {
      userHouseholds: bob,
    }
  }

  return {
    userHouseholds: [],
  }
  
}