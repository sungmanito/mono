import { type } from 'arktype';

export const ulidValidator = type('string & /^[0-9A-HJKMNP-TV-Z]{26}$/');

export const dueDate = type('1<=number.integer<=28');
