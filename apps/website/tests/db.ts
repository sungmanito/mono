import pg from 'pg';

/**
 * Opens a short-lived Postgres connection against the same `DB_URL` the app
 * uses, runs `fn`, and always closes the socket afterwards (no pooled handle is
 * left to keep the Playwright runner alive).
 *
 * Deliberately raw `pg` rather than Drizzle + `@sungmanito/db`: Playwright's
 * loader treats the workspace schema package as CommonJS and its named exports
 * fail to resolve. These queries are trivial enough not to need the ORM.
 */
async function withClient<T>(
  fn: (client: pg.Client) => Promise<T>,
): Promise<T> {
  if (!process.env.DB_URL) {
    throw new Error('DB_URL must be set for tests that seed the database');
  }
  const client = new pg.Client({ connectionString: process.env.DB_URL });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

/**
 * Ensures the bill named `billName` has an (unpaid) payment row for the current
 * month, inserting one if it's missing.
 *
 * `createBill` only seeds a current-month payment when the due day hasn't passed
 * yet, and the `/actions` cron seeds ~5 days out, so a bill created in the last
 * days of the month otherwise has no current-month payment and drops out of the
 * household detail view's inner join. Seeding directly makes the household
 * detail filter assertions deterministic on every calendar day.
 *
 * Matches `getHouseholdDetail`'s join, which keys on month/year of `for_month_d`
 * (the day component is irrelevant there). Idempotent via the
 * `(bill_id, for_month_d)` unique index.
 */
export async function ensureCurrentMonthPayment(
  billName: string,
): Promise<void> {
  await withClient(async (client) => {
    const { rows } = await client.query<{
      id: string;
      household_id: string;
      due_date: number;
    }>(
      'select id, household_id, due_date from bills where bill_name = $1 limit 1',
      [billName],
    );
    const bill = rows[0];
    if (!bill) {
      throw new Error(
        `ensureCurrentMonthPayment: no bill named "${billName}" found`,
      );
    }

    const now = new Date();
    const forMonthD =
      `${now.getUTCFullYear()}-` +
      `${String(now.getUTCMonth() + 1).padStart(2, '0')}-` +
      `${String(bill.due_date).padStart(2, '0')}`;

    await client.query(
      `insert into payments (bill_id, household_id, for_month_d)
       values ($1, $2, $3)
       on conflict (bill_id, for_month_d) do nothing`,
      [bill.id, bill.household_id, forMonthD],
    );
  });
}
