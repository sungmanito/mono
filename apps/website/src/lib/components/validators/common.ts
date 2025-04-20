import { type } from 'arktype';

export const base = type.module({
  ulid: 'string & /^[0-9A-HJKMNP-TV-Z]{26}$/',
  dueDate: '1<=number<=28',
  currency: 'string & /[A-Z]{3}/',
});
