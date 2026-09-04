import { describe, it, expect } from 'vitest';
import {
  DEFAULT_RECURRENCE,
  RECURRENCE_PRESETS,
  RecurrenceError,
  formatDuration,
  nextOccurrenceOnOrAfter,
  occurrencesBetween,
  parseDuration,
  toPostgresInterval,
  type Duration,
} from './recurrence';

const utc = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const iso = (date: Date) => date.toISOString().slice(0, 10);

describe('parseDuration', () => {
  it('parses each single-unit form', () => {
    expect(parseDuration('P7D')).toEqual({ unit: 'day', count: 7 });
    expect(parseDuration('P3M')).toEqual({ unit: 'month', count: 3 });
    expect(parseDuration('P1Y')).toEqual({ unit: 'year', count: 1 });
  });

  it('normalizes weeks to days', () => {
    expect(parseDuration('P1W')).toEqual({ unit: 'day', count: 7 });
    expect(parseDuration('P2W')).toEqual({ unit: 'day', count: 14 });
  });

  it('accepts every preset', () => {
    for (const preset of RECURRENCE_PRESETS) {
      expect(() => parseDuration(preset.iso)).not.toThrow();
    }
  });

  it.each([
    ['bare P', 'P'],
    ['zero count', 'P0M'],
    ['negative count', 'P-1M'],
    ['non-integer count', 'P1.5M'],
    ['mixed units', 'P1Y2M'],
    ['time component', 'P1DT12H'],
    ['bare time component', 'PT12H'],
    ['lowercase', 'p1m'],
    ['not a duration', '1M'],
    ['empty string', ''],
  ])('rejects %s', (_label, value) => {
    expect(() => parseDuration(value)).toThrow(RecurrenceError);
  });
});

describe('formatDuration', () => {
  it('emits the canonical single-unit form', () => {
    expect(formatDuration({ unit: 'day', count: 7 })).toBe('P7D');
    expect(formatDuration({ unit: 'month', count: 3 })).toBe('P3M');
    expect(formatDuration({ unit: 'year', count: 1 })).toBe('P1Y');
  });

  it('never emits weeks', () => {
    expect(formatDuration(parseDuration('P2W'))).toBe('P14D');
  });

  it('round-trips every preset', () => {
    for (const preset of RECURRENCE_PRESETS) {
      expect(formatDuration(parseDuration(preset.iso))).toBe(preset.iso);
    }
  });

  it('rejects an invalid count', () => {
    expect(() => formatDuration({ unit: 'day', count: 0 } as Duration)).toThrow(
      RecurrenceError,
    );
  });
});

describe('toPostgresInterval', () => {
  it('maps the presets to their stored interval literal', () => {
    expect(toPostgresInterval('P7D')).toBe('7 days');
    expect(toPostgresInterval('P14D')).toBe('14 days');
    expect(toPostgresInterval('P1M')).toBe('1 mons');
    expect(toPostgresInterval('P3M')).toBe('3 mons');
    expect(toPostgresInterval('P1Y')).toBe('1 years');
  });

  it('accepts a parsed Duration', () => {
    expect(toPostgresInterval({ unit: 'month', count: 6 })).toBe('6 mons');
  });

  it('validates a constructed Duration same as it would a string', () => {
    expect(() =>
      toPostgresInterval({ unit: 'day', count: -5 } as Duration),
    ).toThrow(RecurrenceError);
    expect(() =>
      toPostgresInterval({ unit: 'month', count: 0 } as Duration),
    ).toThrow(RecurrenceError);
  });
});

describe('RECURRENCE_PRESETS', () => {
  it('has monthly as the default recurrence', () => {
    const monthly = RECURRENCE_PRESETS.find((p) => p.id === 'monthly');
    expect(monthly?.iso).toBe(DEFAULT_RECURRENCE);
  });
});

describe('nextOccurrenceOnOrAfter', () => {
  it('returns the anchor when from is on or before it', () => {
    const anchor = utc('2026-03-10');
    expect(iso(nextOccurrenceOnOrAfter(anchor, 'P1M', utc('2026-01-01')))).toBe(
      '2026-03-10',
    );
    expect(iso(nextOccurrenceOnOrAfter(anchor, 'P1M', anchor))).toBe(
      '2026-03-10',
    );
  });

  it('rolls a monthly bill forward to the next occurrence', () => {
    const anchor = utc('2026-01-02');
    // from Jan 31: Jan 2 already happened, next is Feb 2
    expect(iso(nextOccurrenceOnOrAfter(anchor, 'P1M', utc('2026-01-31')))).toBe(
      '2026-02-02',
    );
  });

  it('lands exactly on an occurrence date', () => {
    const anchor = utc('2026-01-15');
    expect(iso(nextOccurrenceOnOrAfter(anchor, 'P3M', utc('2026-04-15')))).toBe(
      '2026-04-15',
    );
  });

  it('projects a quarterly bill across many periods cheaply', () => {
    const anchor = utc('2020-01-15');
    expect(iso(nextOccurrenceOnOrAfter(anchor, 'P3M', utc('2026-02-01')))).toBe(
      '2026-04-15',
    );
  });

  it('handles weekly cadence', () => {
    const anchor = utc('2026-01-05');
    expect(iso(nextOccurrenceOnOrAfter(anchor, 'P7D', utc('2026-01-06')))).toBe(
      '2026-01-12',
    );
  });

  it('crosses a year boundary', () => {
    const anchor = utc('2025-11-20');
    expect(iso(nextOccurrenceOnOrAfter(anchor, 'P1M', utc('2025-12-21')))).toBe(
      '2026-01-20',
    );
  });
});

describe('occurrencesBetween', () => {
  it('is half-open: includes from, excludes to', () => {
    const anchor = utc('2026-01-10');
    const dates = occurrencesBetween(
      anchor,
      'P1M',
      utc('2026-01-10'),
      utc('2026-03-10'),
    ).map(iso);
    expect(dates).toEqual(['2026-01-10', '2026-02-10']);
  });

  it('never returns occurrences before the anchor', () => {
    const anchor = utc('2026-06-01');
    const dates = occurrencesBetween(
      anchor,
      'P1M',
      utc('2026-01-01'),
      utc('2026-08-01'),
    ).map(iso);
    expect(dates).toEqual(['2026-06-01', '2026-07-01']);
  });

  it('returns an empty array when the range is empty or inverted', () => {
    const anchor = utc('2026-01-01');
    expect(
      occurrencesBetween(anchor, 'P1M', utc('2026-05-01'), utc('2026-05-01')),
    ).toEqual([]);
    expect(
      occurrencesBetween(anchor, 'P1M', utc('2026-06-01'), utc('2026-05-01')),
    ).toEqual([]);
  });

  it('returns an empty array when the whole range precedes the anchor', () => {
    const anchor = utc('2026-06-01');
    expect(
      occurrencesBetween(anchor, 'P1M', utc('2026-01-01'), utc('2026-06-01')),
    ).toEqual([]);
  });

  it('yields multiple occurrences within a single month for a weekly bill', () => {
    const anchor = utc('2026-01-01');
    const dates = occurrencesBetween(
      anchor,
      'P7D',
      utc('2026-01-01'),
      utc('2026-02-01'),
    ).map(iso);
    expect(dates).toEqual([
      '2026-01-01',
      '2026-01-08',
      '2026-01-15',
      '2026-01-22',
      '2026-01-29',
    ]);
  });

  it('projects a quarterly bill over a 45-day window', () => {
    const anchor = utc('2026-01-15');
    const window = occurrencesBetween(
      anchor,
      'P3M',
      utc('2026-03-20'),
      utc('2026-05-04'),
    ).map(iso);
    expect(window).toEqual(['2026-04-15']);
  });

  it('handles an annual bill across a year boundary', () => {
    const anchor = utc('2024-02-10');
    const dates = occurrencesBetween(
      anchor,
      'P1Y',
      utc('2025-01-01'),
      utc('2027-01-01'),
    ).map(iso);
    expect(dates).toEqual(['2025-02-10', '2026-02-10']);
  });

  it('biweekly cadence steps evenly across month boundaries', () => {
    const anchor = utc('2026-01-20');
    const dates = occurrencesBetween(
      anchor,
      'P14D',
      utc('2026-01-20'),
      utc('2026-03-20'),
    ).map(iso);
    expect(dates).toEqual([
      '2026-01-20',
      '2026-02-03',
      '2026-02-17',
      '2026-03-03',
      '2026-03-17',
    ]);
  });
});

describe('month-end clamping (matches Postgres date + interval)', () => {
  it('clamps a 31st anchor into February and back out again', () => {
    // The DB caps the anchor day at 28, so this only exercises the guard.
    const anchor = utc('2026-01-31');
    const dates = occurrencesBetween(
      anchor,
      'P1M',
      utc('2026-01-31'),
      utc('2026-05-01'),
    ).map(iso);
    expect(dates).toEqual([
      '2026-01-31',
      '2026-02-28', // clamped
      '2026-03-31', // computed from the anchor, not the clamped Feb date
      '2026-04-30', // clamped
    ]);
  });

  it('clamps a Feb-29 annual anchor onto non-leap years', () => {
    const anchor = utc('2024-02-29');
    const dates = occurrencesBetween(
      anchor,
      'P1Y',
      utc('2024-02-29'),
      utc('2029-01-01'),
    ).map(iso);
    expect(dates).toEqual([
      '2024-02-29',
      '2025-02-28',
      '2026-02-28',
      '2027-02-28',
      '2028-02-29', // leap year again
    ]);
  });
});

describe('input validation', () => {
  it('throws on an invalid Date', () => {
    expect(() =>
      nextOccurrenceOnOrAfter(new Date('nope'), 'P1M', utc('2026-01-01')),
    ).toThrow(RecurrenceError);
    expect(() =>
      occurrencesBetween(
        utc('2026-01-01'),
        'P1M',
        new Date('nope'),
        utc('2026-02-01'),
      ),
    ).toThrow(RecurrenceError);
  });

  it('reads only the UTC calendar day of the inputs', () => {
    const anchor = new Date('2026-01-10T23:30:00.000Z');
    const from = new Date('2026-01-10T23:30:00.000Z');
    const [first] = occurrencesBetween(anchor, 'P1M', from, utc('2026-02-01'));
    expect(iso(first)).toBe('2026-01-10');
    expect(first.getUTCHours()).toBe(0);
  });
});
