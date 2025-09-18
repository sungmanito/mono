import { ulidValidator as ulid } from './typesValidators';
import { describe, it, expect } from 'vitest';

describe('ulid arktype validator', () => {
  it('accepts valid ULID ids', () => {
    // Some valid ULIDs
    const valid = [
      '01H7FQY9ZJ8Q2X4V7K2Q8YB6QG',
      '01ARYZ6S41TSV4RRFFQ69G5FAV',
      '7ZZZZZZZZZZZZZZZZZZZZZZZZZ',
      '00000000000000000000000000',
    ];
    for (const id of valid) {
      expect(() => ulid.assert(id)).not.toThrow();
    }
  });

  it('rejects invalid ULID ids', () => {
    // Too short, too long, invalid chars, lowercase, ambiguous chars
    const invalid = [
      '01H7FQY9ZJ8Q2X4V7K2Q8YB6Q', // 25 chars
      '01H7FQY9ZJ8Q2X4V7K2Q8YB6QGG', // 27 chars
      '01H7FQY9ZJ8Q2X4V7K2Q8YB6Q!', // invalid char !
      '01h7fqy9zj8q2x4v7k2q8yb6qg', // lowercase
      '01H7FQY9ZJ8Q2X4V7K2Q8YB6QI', // contains I
      '01H7FQY9ZJ8Q2X4V7K2Q8YB6QL', // contains L
      '01H7FQY9ZJ8Q2X4V7K2Q8YB6QO', // contains O
      '01H7FQY9ZJ8Q2X4V7K2Q8YB6QU', // contains U
    ];
    for (const id of invalid) {
      expect(() => ulid.assert(id)).toThrow();
    }
  });
});
