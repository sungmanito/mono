// User's info is managed by supabase, so we can only do read operations on the
// "auth" schema.
import { db, schema } from '$lib/server/db';
import type { SupabaseClient } from '@supabase/supabase-js';
import { eq, sql } from 'drizzle-orm';

export async function userExists(email: string) {
  const [user] = await db
    .select({
      exists: sql<boolean>`count(*) = 1 as exists`,
    })
    .from(schema.users)
    .where(eq(schema.users.email, email));
  return user.exists;
}
