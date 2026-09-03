/**
 * Shared recurrence helper for non-monthly bills (SUN-34, part of SUN-5).
 *
 * A bill recurs on a fixed interval - "every N days / weeks / months / years"
 * from an anchor date. This module is the single tested place the website
 * reasons about bill occurrences; it replaces `resolveNextDueDate`
 * (`src/lib/server/reminders.ts`) and the edge fn's `nextMonthDateFor`.
 *
 * The Postgres `generate_due_payments` generator (SUN-35) projects the same
 * math with `generate_series(anchor, upper, recurrence)`. Every function here
 * is built to agree with Postgres `date + k * interval` - including month-end
 * clamping - so the app and the SQL generator never disagree on an occurrence
 * date. The DB caps the anchor day at 1-28, so clamping is only ever a guard.
 *
 * All dates are handled by their UTC calendar day, matching a Postgres `date`
 * column. Callers pass `Date` values; only the UTC year/month/day is read, and
 * every returned `Date` is UTC midnight.
 */

export class RecurrenceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RecurrenceError';
  }
}

/** A recurrence interval, normalized to a single unit (weeks become days). */
export type Duration =
  | { unit: 'day'; count: number }
  | { unit: 'month'; count: number }
  | { unit: 'year'; count: number };

export interface RecurrencePreset {
  id:
    | 'weekly'
    | 'biweekly'
    | 'monthly'
    | 'bimonthly'
    | 'quarterly'
    | 'semiannual'
    | 'annual';
  label: string;
  /** ISO-8601 duration - the value stored on the form / sent to the API. */
  iso: string;
}

/**
 * Presets offered by the recurrence picker (SUN-37), plus a "custom every N
 * [days | weeks | months | years]" the picker builds itself. Weeks are stored
 * as days so the interval steps evenly and is unambiguous.
 */
export const RECURRENCE_PRESETS: readonly RecurrencePreset[] = [
  { id: 'weekly', label: 'Weekly', iso: 'P7D' },
  { id: 'biweekly', label: 'Biweekly', iso: 'P14D' },
  { id: 'monthly', label: 'Monthly', iso: 'P1M' },
  { id: 'bimonthly', label: 'Every 2 months', iso: 'P2M' },
  { id: 'quarterly', label: 'Quarterly', iso: 'P3M' },
  { id: 'semiannual', label: 'Semi-annual', iso: 'P6M' },
  { id: 'annual', label: 'Annual', iso: 'P1Y' },
] as const;

/** The column default - monthly is never a code branch, just this value. */
export const DEFAULT_RECURRENCE = 'P1M';

// Matches a whole-day ISO-8601 duration: any one of years / months / weeks /
// days. Time components (`T...`) and `P` alone deliberately do not match.
const ISO_DURATION_RE = /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?$/;

/**
 * Parse an ISO-8601 duration into a single-unit {@link Duration}.
 *
 * Accepts `P{n}Y`, `P{n}M`, `P{n}W` (normalized to `P{7n}D`), `P{n}D`.
 * Rejects `n < 1`, non-integer `n`, any time component, mixed units, and a
 * bare `P`.
 */
export function parseDuration(iso: string): Duration {
  if (typeof iso !== 'string') {
    throw new RecurrenceError(`Duration must be a string, got ${typeof iso}`);
  }

  const match = ISO_DURATION_RE.exec(iso);
  if (!match) {
    throw new RecurrenceError(
      `Invalid ISO-8601 duration: ${JSON.stringify(iso)}`,
    );
  }

  const [, years, months, weeks, days] = match;
  const present = [years, months, weeks, days].filter((v) => v !== undefined);
  if (present.length !== 1) {
    throw new RecurrenceError(
      `Recurrence must use exactly one unit: ${JSON.stringify(iso)}`,
    );
  }

  if (years !== undefined) return makeDuration('year', Number(years));
  if (months !== undefined) return makeDuration('month', Number(months));
  if (weeks !== undefined) return makeDuration('day', Number(weeks) * 7);
  return makeDuration('day', Number(days));
}

/**
 * Format a {@link Duration} as its canonical ISO-8601 string. Always a single
 * unit - never `P2W` (emits `P14D`), never mixed.
 */
export function formatDuration(duration: Duration): string {
  const { unit, count } = duration;
  if (!Number.isInteger(count) || count < 1) {
    throw new RecurrenceError(
      `Duration count must be an integer >= 1, got ${count}`,
    );
  }
  switch (unit) {
    case 'day':
      return `P${count}D`;
    case 'month':
      return `P${count}M`;
    case 'year':
      return `P${count}Y`;
    default:
      throw new RecurrenceError(`Unknown duration unit: ${unit as string}`);
  }
}

/**
 * The Postgres `interval` literal for a duration - the canonical value stored
 * in `bills.recurrence`, kept here so the app and the SQL generator use the
 * exact same mapping (`P3M` <-> `3 mons`, `P14D` <-> `14 days`).
 */
export function toPostgresInterval(recurrence: string | Duration): string {
  const duration =
    typeof recurrence === 'string' ? parseDuration(recurrence) : recurrence;
  switch (duration.unit) {
    case 'day':
      return `${duration.count} days`;
    case 'month':
      return `${duration.count} mons`;
    case 'year':
      return `${duration.count} years`;
  }
}

/**
 * Every occurrence of a bill in the half-open range `[from, to)`.
 *
 * Occurrences are `anchor, anchor + recurrence, anchor + 2*recurrence, ...`;
 * none before the anchor are ever returned. A weekly bill legitimately
 * returns several dates for a single month.
 */
export function occurrencesBetween(
  anchorDate: Date,
  recurrence: string | Duration,
  from: Date,
  to: Date,
): Date[] {
  const anchor = toUTCMidnight(anchorDate, 'anchorDate');
  const duration = normalizeRecurrence(recurrence);
  const lower = toUTCMidnight(from, 'from');
  const upper = toUTCMidnight(to, 'to');

  const results: Date[] = [];
  if (upper.getTime() <= lower.getTime()) return results;
  if (upper.getTime() <= anchor.getTime()) return results;

  let k = firstIndexOnOrAfter(anchor, duration, lower);
  for (let guard = 0; guard < MAX_OCCURRENCES; guard++) {
    const occurrence = occurrenceAt(anchor, duration, k);
    if (occurrence.getTime() >= upper.getTime()) return results;
    results.push(occurrence);
    k++;
  }

  throw new RecurrenceError(
    `occurrencesBetween produced more than ${MAX_OCCURRENCES} dates - range or recurrence looks wrong`,
  );
}

/**
 * The first occurrence of a bill on or after `from`. If `from` is on or before
 * the anchor, the anchor itself is returned.
 */
export function nextOccurrenceOnOrAfter(
  anchorDate: Date,
  recurrence: string | Duration,
  from: Date,
): Date {
  const anchor = toUTCMidnight(anchorDate, 'anchorDate');
  const duration = normalizeRecurrence(recurrence);
  const target = toUTCMidnight(from, 'from');

  if (target.getTime() <= anchor.getTime()) return anchor;

  const k = firstIndexOnOrAfter(anchor, duration, target);
  return occurrenceAt(anchor, duration, k);
}

// --- internals --------------------------------------------------------------

const MAX_OCCURRENCES = 10_000;

function makeDuration(unit: Duration['unit'], count: number): Duration {
  if (!Number.isInteger(count) || count < 1) {
    throw new RecurrenceError(
      `Recurrence count must be an integer >= 1, got ${count}`,
    );
  }
  return { unit, count } as Duration;
}

function normalizeRecurrence(recurrence: string | Duration): Duration {
  if (typeof recurrence === 'string') return parseDuration(recurrence);
  return makeDuration(recurrence.unit, recurrence.count);
}

function toUTCMidnight(date: Date, label: string): Date {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new RecurrenceError(`${label} must be a valid Date`);
  }
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

/** `date + n months`, clamping to the last day of the target month (Postgres semantics). */
function addMonths(date: Date, months: number): Date {
  const year = date.getUTCFullYear();
  const monthIndex = date.getUTCMonth();
  const day = date.getUTCDate();

  const absolute = monthIndex + months;
  const targetYear = year + Math.floor(absolute / 12);
  const targetMonth = ((absolute % 12) + 12) % 12;
  const targetDay = Math.min(day, daysInMonth(targetYear, targetMonth));

  return new Date(Date.UTC(targetYear, targetMonth, targetDay));
}

function addDays(date: Date, days: number): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate() + days,
    ),
  );
}

/** The k-th occurrence (k >= 0), computed as `anchor + k*recurrence` in one step. */
function occurrenceAt(anchor: Date, duration: Duration, k: number): Date {
  switch (duration.unit) {
    case 'day':
      return addDays(anchor, duration.count * k);
    case 'month':
      return addMonths(anchor, duration.count * k);
    case 'year':
      return addMonths(anchor, duration.count * 12 * k);
  }
}

/**
 * Smallest k >= 0 such that `occurrenceAt(anchor, duration, k) >= target`.
 * Starts from a cheap estimate, then corrects in both directions so month-end
 * clamping can never make it off-by-one.
 */
function firstIndexOnOrAfter(
  anchor: Date,
  duration: Duration,
  target: Date,
): number {
  const msPerDay = 86_400_000;
  let k: number;

  if (duration.unit === 'day') {
    const dayGap = (target.getTime() - anchor.getTime()) / msPerDay;
    k = Math.floor(dayGap / duration.count);
  } else {
    const monthStep =
      duration.unit === 'year' ? duration.count * 12 : duration.count;
    const monthGap =
      (target.getUTCFullYear() - anchor.getUTCFullYear()) * 12 +
      (target.getUTCMonth() - anchor.getUTCMonth());
    k = Math.floor(monthGap / monthStep);
  }

  if (k < 0) k = 0;

  while (
    k > 0 &&
    occurrenceAt(anchor, duration, k - 1).getTime() >= target.getTime()
  ) {
    k--;
  }
  while (occurrenceAt(anchor, duration, k).getTime() < target.getTime()) {
    k++;
  }
  return k;
}
