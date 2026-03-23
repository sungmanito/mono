import { form, getRequestEvent, query } from '$app/server';
import { db } from '$lib/server/db';
import { ulidValidator } from '$lib/typesValidators';
import schema from '@sungmanito/db';

export type Household = typeof schema.households.$inferSelect;
import { error } from '@sveltejs/kit';
import { type } from 'arktype';
import {
  and,
  asc,
  count,
  eq,
  getTableColumns,
  inArray,
  like,
  or,
  sql,
} from 'drizzle-orm';
import { getUser, getUserHouseholds } from './common.remote';

export const getUserHouseholdsWithBillCount = query(async () => {
  const userHouseholds = await getUserHouseholds();
  const ids = userHouseholds.map((h) => h.id);
  if (ids.length === 0) return [];
  return db
    .select({
      id: schema.households.id,
      name: schema.households.name,
      ownerId: schema.households.ownerId,
      billCount: sql<number>`count(${schema.bills.id})::integer`,
    })
    .from(schema.households)
    .leftJoin(schema.bills, eq(schema.bills.householdId, schema.households.id))
    .groupBy(schema.households.id)
    .where(inArray(schema.households.id, ids))
    .orderBy(schema.households.name);
});

export const getUserHouseholdsWithMembers = query(async () => {
  const userHouseholds = await getUserHouseholds();
  const ids = userHouseholds.map((h) => h.id);
  if (ids.length === 0)
    return {} as Record<
      string,
      {
        householdId: string;
        householdName: string;
        users: {
          id: string;
          isOwner: boolean;
          email: string;
          userMetadata: unknown;
        }[];
      }
    >;
  const rows = await db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      userMetadata: schema.users.userMetadata,
      householdId: schema.usersToHouseholds.householdId,
      householdName: schema.households.name,
      isOwner: sql<boolean>`${schema.households.ownerId} = ${schema.users.id}`,
    })
    .from(schema.users)
    .innerJoin(
      schema.usersToHouseholds,
      and(
        inArray(schema.usersToHouseholds.householdId, ids),
        eq(schema.usersToHouseholds.userId, schema.users.id),
      ),
    )
    .innerJoin(
      schema.households,
      eq(schema.households.id, schema.usersToHouseholds.householdId),
    );
  return rows.reduce(
    (all, cur) => {
      if (!all[cur.householdId])
        all[cur.householdId] = {
          householdId: cur.householdId,
          householdName: cur.householdName,
          users: [],
        };
      all[cur.householdId].users.push({
        id: cur.id,
        isOwner: cur.isOwner,
        email: cur.email,
        userMetadata: cur.userMetadata,
      });
      return all;
    },
    {} as Record<
      string,
      {
        householdId: string;
        householdName: string;
        users: {
          id: string;
          isOwner: boolean;
          email: string;
          userMetadata: unknown;
        }[];
      }
    >,
  );
});

export const getPendingInvites = query(async () => {
  const user = await getUser();
  return db
    .select({
      ...getTableColumns(schema.invites),
      household: {
        id: schema.households.id,
        name: schema.households.name,
        bills: count(schema.bills.id),
        members: count(schema.usersToHouseholds.id),
      },
    })
    .from(schema.invites)
    .innerJoin(
      schema.households,
      eq(schema.households.id, schema.invites.householdId),
    )
    .leftJoin(schema.bills, eq(schema.bills.householdId, schema.households.id))
    .leftJoin(
      schema.usersToHouseholds,
      eq(schema.usersToHouseholds.householdId, schema.households.id),
    )
    .groupBy(schema.invites.id, schema.households.id)
    .where(eq(schema.invites.toId, user.id));
});

export const getUserBillsByHousehold = query(async () => {
  const userHouseholds = await getUserHouseholds();
  const ids = userHouseholds.map((h) => h.id);
  if (ids.length === 0)
    return {} as Record<string, (typeof schema.bills.$inferSelect)[]>;
  const bills = await db
    .select()
    .from(schema.bills)
    .where(inArray(schema.bills.householdId, ids))
    .orderBy(asc(schema.bills.dueDate), asc(schema.bills.billName));
  return bills.reduce(
    (all, cur) => {
      if (!all[cur.householdId]) all[cur.householdId] = [cur];
      else all[cur.householdId].push(cur);
      return all;
    },
    {} as Record<string, (typeof schema.bills.$inferSelect)[]>,
  );
});

export const getHouseholdDetail = query(ulidValidator, async (id) => {
  const userHouseholds = await getUserHouseholds();
  const ids = userHouseholds.map((h) => h.id);
  const household = await db.query.households.findFirst({
    where: ({ id: hId }, { eq, and, inArray }) =>
      and(eq(hId, id), inArray(hId, ids)),
  });
  if (!household) error(404);
  const bills = await db
    .select({
      ...getTableColumns(schema.bills),
      isPaid: sql<boolean>`${schema.payments.paidAt} is not null`,
      paymentId: schema.payments.id,
      paidAt: schema.payments.paidAt,
      pastDue: sql<boolean>`${schema.payments.paidAt} is null and ${schema.bills.dueDate} < extract(day from now())`,
      hasProof: sql<boolean>`${schema.payments.paidAt} is not null and ${schema.payments.proofImage} is not null`,
    })
    .from(schema.bills)
    .innerJoin(
      schema.payments,
      and(
        eq(schema.payments.billId, schema.bills.id),
        sql`extract(month from ${schema.payments.forMonthD}) = extract(month from now())`,
        sql`extract(year from ${schema.payments.forMonthD}) = extract(year from now())`,
      ),
    )
    .where(eq(schema.bills.householdId, id));
  const invites = await db
    .select()
    .from(schema.invites)
    .where(eq(schema.invites.householdId, household.id));
  return { household, bills, invites };
});

export const getHouseholdMembers = query(ulidValidator, async (householdId) => {
  return db
    .select({
      id: schema.users.id,
      email: schema.users.email,
      householdId: schema.usersToHouseholds.householdId,
      householdName: schema.households.name,
      isOwner: sql<boolean>`${schema.households.ownerId} = ${schema.users.id}`,
      name: sql`${schema.users.userMetadata} -> 'name'`,
    })
    .from(schema.users)
    .innerJoin(
      schema.usersToHouseholds,
      eq(schema.usersToHouseholds.userId, schema.users.id),
    )
    .innerJoin(
      schema.households,
      eq(schema.households.id, schema.usersToHouseholds.householdId),
    )
    .where(eq(schema.households.id, householdId));
});

export const addHousehold = form(
  type({ 'household-name': 'string', 'members?': 'string.email[]' }),
  async (data) => {
    const user = await getUser();
    const { locals, url } = await getRequestEvent();
    const members = Array.isArray(data.members)
      ? data.members
      : data.members
        ? [data.members]
        : [];
    const [newHome] = await db
      .insert(schema.households)
      .values({ name: data['household-name'], ownerId: user.id })
      .returning();
    if (!newHome) error(400, 'Failed to create household');
    if (members.length > 0) {
      for (const email of members.filter((e) => e !== 'email@email.com')) {
        const existing = await db
          .select()
          .from(schema.users)
          .where(like(schema.users.email, email))
          .then((r) => r[0]);
        let toId = existing?.id;
        if (!toId) {
          const { data: invData } =
            await locals.supabase.auth.admin.inviteUserByEmail(email, {
              redirectTo: `${url.protocol}//${url.host}/login`,
            });
          if (invData?.user) toId = invData.user.id;
        }
        if (toId) {
          await db
            .insert(schema.invites)
            .values({
              fromEmail: user.email as string,
              toEmail: email,
              householdId: newHome.id,
              fromId: user.id,
              toId,
            })
            .onConflictDoNothing();
        }
      }
    }
    getUserHouseholdsWithBillCount().refresh();
    getUserHouseholdsWithMembers().refresh();
    return newHome;
  },
);

export const respondToInvite = form(
  type({ 'invite-id': 'string', action: "'accept'|'delete'" }),
  async (data) => {
    const user = await getUser();
    if (data.action === 'accept') {
      await db.transaction(async (tx) => {
        const [inv] = await tx
          .select()
          .from(schema.invites)
          .where(
            and(
              eq(schema.invites.id, data['invite-id']),
              eq(schema.invites.toId, user.id),
            ),
          );
        if (!inv) {
          tx.rollback();
          return;
        }
        await tx
          .insert(schema.usersToHouseholds)
          .values({ userId: user.id, householdId: inv.householdId });
        await tx.delete(schema.invites).where(eq(schema.invites.id, inv.id));
      });
    } else {
      await db
        .delete(schema.invites)
        .where(
          and(
            eq(schema.invites.id, data['invite-id']),
            eq(schema.invites.toId, user.id),
          ),
        );
    }
    getPendingInvites().refresh();
    getUserHouseholdsWithBillCount().refresh();
  },
);

export const deleteHousehold = form(
  type({ 'household-id': 'string' }),
  async (data) => {
    const user = await getUser();
    const deleted = await db.transaction(async (tx) => {
      const [{ isOwner }] = await tx
        .select({
          isOwner: sql<boolean>`${schema.households.ownerId} = ${user.id}`,
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
    getUserHouseholdsWithBillCount().refresh();
  },
);

export const updateHousehold = form(
  type({ 'household-id': 'string', name: 'string>=2' }),
  async (data) => {
    const userHouseholds = await getUserHouseholds();
    if (!userHouseholds.find((h) => h.id === data['household-id'])) error(401);
    const [returned] = await db
      .update(schema.households)
      .set({ name: data.name })
      .where(eq(schema.households.id, data['household-id']))
      .returning();
    getUserHouseholdsWithBillCount().refresh();
    return { household: returned };
  },
);

export const findUser = form(type({ user: 'string' }), async (data) => {
  return db
    .select()
    .from(schema.users)
    .where(
      or(
        sql`${schema.users.userMetadata}->>'name' ilike ${'%' + data.user + '%'}`,
        like(schema.users.email, `%${data.user as string}%`),
        eq(schema.users.email, data.user as string),
      ),
    );
});

export const removeMember = form(
  type({ userId: 'string', householdId: ulidValidator }),
  async (data) => {
    const user = await getUser();
    const [household] = await db
      .select({ ownerId: schema.households.ownerId })
      .from(schema.households)
      .where(eq(schema.households.id, data.householdId));
    const isOwner = user.id === household?.ownerId;
    const isSelf = user.id === data.userId;
    if (!(isOwner || isSelf)) error(400);
    await db
      .delete(schema.usersToHouseholds)
      .where(
        and(
          eq(schema.usersToHouseholds.userId, data.userId),
          eq(schema.usersToHouseholds.householdId, data.householdId),
        ),
      );
    getUserHouseholdsWithBillCount().refresh();
    getUserHouseholdsWithMembers().refresh();
    getHouseholdDetail(data.householdId).refresh();
  },
);

export const inviteUsers = form(
  type({ 'emails[]': 'string[]', 'household-id': ulidValidator }),
  async (data) => {
    const user = await getUser();
    const { locals, url } = await getRequestEvent();
    const emails = data['emails[]'].filter((e) => e !== 'email@email.com');
    await db.transaction(async (tx) => {
      for (const email of emails) {
        const existing = await db
          .select({ id: schema.users.id })
          .from(schema.users)
          .where(eq(schema.users.email, email))
          .then((r) => r[0]);
        let toId = existing?.id;
        if (!toId) {
          const { data: invData, error: invErr } =
            await locals.supabase.auth.admin.inviteUserByEmail(email, {
              redirectTo: `${url.protocol}//${url.host}/login`,
            });
          if (invErr || !invData?.user) {
            await tx.rollback();
            return;
          }
          toId = invData.user.id;
        }
        await tx
          .insert(schema.invites)
          .values({
            fromEmail: user.email as string,
            toEmail: email,
            householdId: data['household-id'],
            fromId: user.id,
            toId,
          })
          .onConflictDoNothing();
      }
    });
    getHouseholdDetail(data['household-id']).refresh();
  },
);

export const deleteInvite = form(
  type({ 'invite-id': ulidValidator }),
  async (data) => {
    const user = await getUser();
    const [row] = await db
      .delete(schema.invites)
      .where(
        and(
          eq(schema.invites.id, data['invite-id']),
          inArray(
            schema.invites.householdId,
            db
              .select({ id: schema.households.id })
              .from(schema.households)
              .where(eq(schema.households.ownerId, user.id)),
          ),
        ),
      )
      .returning();
    if (!row) error(500);
    getPendingInvites().refresh();
    return { deleted: row };
  },
);

export const claimHousehold = form(
  type({ 'household-id': ulidValidator }),
  async (data) => {
    const user = await getUser();
    const [returned] = await db
      .update(schema.households)
      .set({ ownerId: user.id, updatedAt: null })
      .where(eq(schema.households.id, data['household-id']))
      .returning();
    getUserHouseholdsWithBillCount().refresh();
    return { household: returned };
  },
);
