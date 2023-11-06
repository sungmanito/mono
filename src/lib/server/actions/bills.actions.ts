import { db, schema } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { NotFound } from '../errors';

export type Bill = typeof schema.bills.$inferSelect;
export type BillInsertArgs = typeof schema.bills.$inferInsert;
export type BillUpdateArgs = Partial<Omit<BillInsertArgs, 'id'>>;

// Should this be where we check for the row stuff... or should we just turn that on in supabase?
export async function updateBill(billId: Bill['id'], obj: BillUpdateArgs) {
  return db.update(schema.bills)
    .set(obj)
    .where(
      eq(schema.bills.id, billId)
    ).returning().then(([r]) => r);
}
/**
 * @description Creates a new bill in the database
 * @param bill Bill args
 * @returns the created bill
 * @throws an error if the bill date does not sit in a normal billing date range.
 */
export async function createBill(bill: BillInsertArgs) {
  if(bill.dueDate && (bill.dueDate > 28 || bill.dueDate < 1))
    throw new RangeError('Date exceeds most bill bounds (must be <=28 and >=1)');

  return db.insert(schema.bills)
    .values(bill)
    .returning()
    .then(([f]) => f);
}

/**
 * 
 * @param billId The ID of the bill we are fetching
 * @returns the bill
 * @throws an error when an error isn't found.
 */
export async function getBill(billId: Bill['id']) {
  return db.select()
    .from(schema.bills)
    .where(eq(schema.bills.id, billId))
    .then((r) => {
      if(r.length > 1 || r.length === 0) throw new NotFound(`Bill not found (id: ${billId})`);
      return r[0];
    });
}

/**
 * 
 * @param billId The ID of the bill we are deleting
 * @returns 
 */
export async function deleteBill(billId: Bill['id']) {
  return db.delete(schema.bills)
    .where(eq(schema.bills.id, billId))
    .returning();
}
