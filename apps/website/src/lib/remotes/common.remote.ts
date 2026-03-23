import { query, getRequestEvent } from '$app/server';
import schema from '@sungmanito/db';
import { db } from '../server/db';
import { eq, getTableColumns } from 'drizzle-orm';
/**
 * This file is used for common things, like getting the current user,
 * the current user's households, etc.
 */

export const getUser = query(async () => {
  const event = getRequestEvent();
  const session = await event.locals.getSession();

  if (!session || !session.user) {
    throw new Error('User not authenticated');
  }

  return session.user;
});

export const getUserHouseholds = query(async () => {
  const event = getRequestEvent();
  const session = await event.locals.getSession();
  if (session === null) return [];

  return db
    .select({
      ...getTableColumns(schema.households),
    })
    .from(schema.households)
    .innerJoin(
      schema.usersToHouseholds,
      eq(schema.households.id, schema.usersToHouseholds.householdId),
    )
    .where(eq(schema.usersToHouseholds.userId, session.user.id));
});
