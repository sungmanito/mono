import { describe, expect, it } from 'vitest';
import { resolveNextDueDate } from './reminders';

describe('resolveNextDueDate', () => {
  it('resolves to this month when the due date is later in the month than today', () => {
    const from = new Date(2026, 0, 10); // Jan 10, 2026
    expect(resolveNextDueDate(15, from)).toEqual(new Date(2026, 0, 15));
  });

  it('rolls over to next month when the due date is earlier in the month than today', () => {
    const from = new Date(2026, 0, 31); // Jan 31, 2026
    expect(resolveNextDueDate(2, from)).toEqual(new Date(2026, 1, 2));
  });

  it('rolls over across a year boundary', () => {
    const from = new Date(2026, 11, 31); // Dec 31, 2026
    expect(resolveNextDueDate(5, from)).toEqual(new Date(2027, 0, 5));
  });

  it('resolves to today when the due date is exactly today', () => {
    const from = new Date(2026, 2, 16); // Mar 16, 2026
    expect(resolveNextDueDate(16, from)).toEqual(new Date(2026, 2, 16));
  });

  it('ignores time-of-day on `from` when comparing to the resolved due date', () => {
    const from = new Date(2026, 2, 16, 23, 59, 59); // Mar 16, 2026, late in the day
    expect(resolveNextDueDate(16, from)).toEqual(new Date(2026, 2, 16));
    expect(resolveNextDueDate(15, from)).toEqual(new Date(2026, 3, 15));
  });
});
