import { describe, expect, it } from 'vitest';
import { getFullTimeBetween, getLastDayOfMonth } from './date';

describe('Date utils', () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  it('Gets the file time between dates', () => {
    const resp = getFullTimeBetween(yesterday);
    console.info(resp);
  });

  it('Gets the last date of a given month', () => {
    const leapYearFeb = new Date(2024, 1, 14);
    const regFeb = new Date(2026, 1, 14);
    expect(getLastDayOfMonth(leapYearFeb)).toBe(29);
    expect(getLastDayOfMonth(regFeb)).toBe(28);
  });
});
