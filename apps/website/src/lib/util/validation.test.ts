import { describe, it, expect } from 'vitest';
import { notNull } from './validation';

describe('Not Null Check', () => {
  it('Returns true for non-null value', () => {
    expect(notNull('something')).toBe(true);
  });
  it('Returns false for null value', () => {
    expect(notNull(null)).toBeFalsy();
  });
});
