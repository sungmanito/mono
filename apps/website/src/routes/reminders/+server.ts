import { db } from '$lib/server/db';
import { renderBillReminderEmail } from '$lib/server/email/billReminderTemplate';
import { resend } from '$lib/server/email/resend';
import { getUpcomingUnpaidBillsByHousehold } from '$lib/server/reminders';
import { exportedSchema as schema } from '@sungmanito/db';
import { error, json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { inArray } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ request }) => {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) error(401);

  const households = await getUpcomingUnpaidBillsByHousehold();

  const results: {
    householdId: string;
    sent: boolean;
    billCount: number;
    error?: string;
  }[] = [];

  for (const [
    householdId,
    { householdName, memberEmails, bills },
  ] of Object.entries(households)) {
    if (memberEmails.length === 0) continue;

    // Claim first: only bills whose insert actually lands go into the email,
    // so a retried run never re-sends a reminder that already succeeded.
    const claimed = await db
      .insert(schema.billReminders)
      .values(
        bills.map((bill) => ({
          billId: bill.id,
          householdId,
          forMonthD: bill.dueDate,
        })),
      )
      .onConflictDoNothing({
        target: [schema.billReminders.billId, schema.billReminders.forMonthD],
      })
      .returning();

    if (claimed.length === 0) continue;

    const claimedBillIds = new Set(claimed.map((row) => row.billId));
    const billsToSend = bills.filter((bill) => claimedBillIds.has(bill.id));

    try {
      const { subject, html, text } = renderBillReminderEmail(
        householdName,
        billsToSend,
      );
      await resend.emails.send({
        from: env.REMINDER_SENDER_EMAIL,
        to: memberEmails,
        subject,
        html,
        text,
      });
      results.push({ householdId, sent: true, billCount: billsToSend.length });
    } catch (err) {
      // Roll back the claim so tomorrow's run retries these bills instead of
      // silently treating them as already-reminded.
      await db.delete(schema.billReminders).where(
        inArray(
          schema.billReminders.id,
          claimed.map((row) => row.id),
        ),
      );
      console.error(
        `Failed to send bill reminder email for household ${householdId}`,
        err,
      );
      results.push({
        householdId,
        sent: false,
        billCount: 0,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return json({ results });
};
