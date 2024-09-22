import { SESClient, SendBulkTemplatedEmailCommand } from '@aws-sdk/client-ses';
import { exportedSchema } from '@sungmanito/db';
import { Context } from 'aws-lambda';
import { SendTemplatedEmailCommand } from '@aws-sdk/client-ses';
import { and, eq, isNull, sql } from 'drizzle-orm';
import db from './db';

const {
  users,
  bills,
  households: householdsTable,
  payments,
  usersToHouseholds,
} = exportedSchema;

interface Env {
  AWS_REGION: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  SENDER_EMAIL: string;
}

export const handler = async (event: any, context: Context) => {
  const today = sql`now()`;
  const threeDaysFromNow = sql`now() + interval '3 days'`;

  const usersWithUpcomingBills = await db
    .select({
      email: users.email,
      billName: bills.billName,
      billDueDate: bills.dueDate,
      householdName: householdsTable.name,
      householdId: householdsTable.id,
    })
    .from(usersToHouseholds)
    .innerJoin(users, eq(usersToHouseholds.userId, users.id))
    .innerJoin(bills, eq(usersToHouseholds.householdId, bills.householdId))
    .innerJoin(
      householdsTable,
      eq(householdsTable.id, usersToHouseholds.householdId),
    )
    .leftJoin(payments, eq(payments.billId, bills.id))
    .where(
      and(
        isNull(payments.paidAt),
        sql`${payments.forMonthD} BETWEEN ${today} AND ${threeDaysFromNow}`,
      ),
    );
  console.info('LOGS', usersWithUpcomingBills);
  return '';

  console.info('LOGS', usersWithUpcomingBills);

  const awsRegion = process.env.AWS_REGION;
  const awsAccessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const awsSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  const senderEmail = process.env.SENDER_EMAIL;

  if (!awsRegion || !awsAccessKeyId || !awsSecretAccessKey || !senderEmail) {
    throw new Error('Missing required AWS environment variables');
  }

  const sesClient = new SESClient({
    region: awsRegion as string,
    credentials: {
      accessKeyId: awsAccessKeyId as string,
      secretAccessKey: awsSecretAccessKey as string,
    },
  });

  // Group data by householdId
  const householdsMap: Record<
    string,
    {
      householdName: string;
      emails: Set<string>;
      bills: Array<{ billName: string; billDueDate: number }>;
    }
  > = {};

  for (const row of usersWithUpcomingBills) {
    if (!householdsMap[row.householdId]) {
      householdsMap[row.householdId] = {
        householdName: row.householdName,
        emails: new Set(),
        bills: [],
      };
    }
    householdsMap[row.householdId].emails.add(row.email as string);
    householdsMap[row.householdId].bills.push({
      billName: row.billName,
      billDueDate: row.billDueDate,
    });
  }

  for (const [householdId, data] of Object.entries(householdsMap)) {
    const params = {
      Source: senderEmail,
      Destination: {
        ToAddresses: Array.from(data.emails),
      },
      Template: 'reminder',
      TemplateData: JSON.stringify({
        count: data.bills.length,
        billList: data.bills,
        householdName: data.householdName,
        householdId: householdId,
      }),
    };

    // Use SendTemplatedEmailCommand for per-household custom email
    const command = new SendTemplatedEmailCommand(params);
    await sesClient.send(command);
  }
};
