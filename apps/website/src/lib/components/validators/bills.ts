import { type } from 'arktype';

export const newBillValidator = type({
  name: 'string',
  dueDate: '1<=number<=28',
  household: 'string',
  'amount?': 'number>0',
  'currency?': 'string>=3',
});
