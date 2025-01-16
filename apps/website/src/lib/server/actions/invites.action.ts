import { validate } from '$lib/util/ark-utils';
import { exportedSchema as schema } from '@sungmanito/db';
import type { SupabaseClient } from '@supabase/supabase-js';
import { type } from 'arktype';
import { inArray } from 'drizzle-orm';
import { db } from '../db';

export const emailValidator = type('email');

export const emailsValidator = type('email[]');

export type Invite = typeof schema.invites.$inferSelect;
export type InviteInsertArgs = typeof schema.invites.$inferInsert;

export async function inviteMembersByEmail(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>,
  emails: string[],
  householdId: string,
  from: {
    fromId: string;
    fromEmail: string;
  },
) {
  // 1. Validate emails
  const validEmails = validate(emails, emailsValidator);

  if (validEmails.length === 0) return [];

  // 2. check for users in the users table already
  const members = await db
    .select()
    .from(schema.users)
    .where(inArray(schema.users.email, validEmails));

  const membersMap = members.reduce(
    (all, cur) => {
      all[cur.email] = cur;
      return all;
    },
    {} as Record<
      string,
      Pick<typeof schema.users.$inferSelect, 'email' | 'id'>
    >,
  );

  console.info('membersMap', membersMap);

  // 3. Filter out the emails that are already on the platform.
  const invitations = validEmails.filter((email) => !membersMap[email]);

  // 4. Send out invites
  const sentInvites = await Promise.allSettled(
    invitations.map((inv) =>
      supabase.auth.admin.inviteUserByEmail(inv).then((r) => {
        if (r.data) return r.data;
        return Promise.reject(r.error);
      }),
    ),
  );

  console.info(sentInvites);

  // Add the sent invites to the membership map.

  sentInvites.reduce((all, cur) => {
    if (cur.status === 'fulfilled' && cur.value.user) {
      all[cur.value.user.id] = cur.value.user as Pick<
        typeof schema.users.$inferSelect,
        'email' | 'id'
      >;
    }
    return all;
  }, membersMap);

  // 5. With created users, create invite table entries

  const dbInvites = await db
    .insert(schema.invites)
    .values(
      Object.entries(membersMap).map(([toEmail, value]) => {
        return {
          toId: value.id,
          toEmail,
          fromEmail: from.fromEmail,
          fromId: from.fromId,
          householdId: householdId,
        };
      }),
    )
    .returning();

  // Send invites to the people that need invites

  return dbInvites;
}
