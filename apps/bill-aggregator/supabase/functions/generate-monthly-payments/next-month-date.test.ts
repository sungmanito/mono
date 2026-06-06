import { assertEquals } from 'std/assert';
import { nextMonthDateFor } from './next-month-date.ts';

Deno.test('nextMonthDateFor: standard mid-month due date', () => {
  // Running in January, due on 15th → Feb 15
  const result = nextMonthDateFor(15, new Date('2026-01-26'));
  assertEquals(result, '2026-02-15');
});

Deno.test('nextMonthDateFor: due date 28 (max)', () => {
  // Running in January, due on 28th → Feb 28
  const result = nextMonthDateFor(28, new Date('2026-01-26'));
  assertEquals(result, '2026-02-28');
});

Deno.test('nextMonthDateFor: due date 1 (min)', () => {
  // Running in January, due on 1st → Feb 01
  const result = nextMonthDateFor(1, new Date('2026-01-26'));
  assertEquals(result, '2026-02-01');
});

Deno.test('nextMonthDateFor: December wraps to January next year', () => {
  // Running in December, due on 15th → Jan 15 of next year
  const result = nextMonthDateFor(15, new Date('2025-12-26'));
  assertEquals(result, '2026-01-15');
});
