import { type } from 'arktype';
import { base } from './common';

export const baseBillValidator = type({
  id: base.ulid,
  name: 'string',
  dueDate: base.dueDate,
  householdId: base.ulid,
  'notes?': 'string',
  'amount?': 'number>0',
  currency: base.currency.default('USD'),
});

export const newBillValidator = baseBillValidator.omit('id');
