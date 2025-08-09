import { db } from '$lib/server/db';

export type TransactionContext = Parameters<
  Parameters<typeof db.transaction>[0]
>[0];
