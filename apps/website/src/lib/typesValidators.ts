import { type } from 'arktype';

export const ulidValidator = type('string & /^[0-9A-HJKMNP-TV-Z]{26}$/');

export const dueDate = type('1<=number.integer<=28');

export const optionalISODateValidator = type(
  /^\d{4}-\d{2}-\d{2}((?:T|\s)\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/,
)
  .or('undefined')
  .or('Date')
  .narrow((value) => {
    if (value === undefined) return true;
    if (value instanceof Date) {
      return !isNaN(value.getTime());
    }
    // For string values, verify the date is actually valid
    const date = new Date(value);
    return !isNaN(date.getTime());
  });
