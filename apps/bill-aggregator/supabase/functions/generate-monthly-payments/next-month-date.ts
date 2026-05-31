/**
 * Returns the ISO date string (YYYY-MM-DD) for a bill's due date in the
 * month following `referenceDate`. Bills have a max due_date of 28, so
 * no month-overflow handling is needed.
 */
export function nextMonthDateFor(dueDate: number, referenceDate: Date): string {
  const next = new Date(
    Date.UTC(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 1),
  );
  const year = next.getUTCFullYear();
  const month = String(next.getUTCMonth() + 1).padStart(2, '0');
  const day = String(dueDate).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
