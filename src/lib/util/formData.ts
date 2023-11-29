import type { Type } from 'arktype';

type EntriesTouple = [string, FormDataEntryValue];

type FilterFn = (a: EntriesTouple) => boolean;

/**
 * 
 * @param fd the form data object
 * @param filterFn an optional filtering function to remove some values from the end object
 * @returns an object mapped from the entries.
 */
export function formDataToObject(fd: FormData, filterFn: FilterFn = () => true) {
  const obj: Record<string, FormDataEntryValue | number | boolean | bigint> = {};
  for(const [key, value] of fd.entries()) {
    // If this passes our key, add in value
    if(filterFn([key, value])) {

      switch(typeof value) {
        // If it is a string we have some parsing optins
        case 'string':

          // Check for numbers
          if (/^(?:\+|-)?\d+(?:\.\d+)?$/.test(value) && value < '9007199254740991') {
            obj[key] = Number(value);
            continue;
          }

          // Check for boolean
          if(/^true|false$/.test(value)) {
            obj[key] = value === 'true';
            continue;
          }

          // Incredibly unlikely, but check for BigInts, JIC
          if (/^\d+n$/.test(value) || (value > '9007199254740991' && /^\d+$/.test(value))) {
            obj[key] = BigInt(value.charAt(value.length -1 ) === 'n' ? value.slice(0, -1) : value);
            continue;
          }

          obj[key] = value;

          break;
        // Otherwise it's a file and honestly, fuck it.
        default:
          obj[key] = value;
      }
      
    }
  }
  return obj;
}
/**
 * 
 * @param fd Form Data object
 * @param obj an ArkType type validator
 * @param filterFn Filter function to run when creating the form data object
 * @returns 
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formDataValidObject<T extends Type<any>>(fd: FormData, obj: T, filterFn?: FilterFn): T extends Type<infer R> ? R : any {
  const fdo = formDataToObject(fd, filterFn);
  const { data, problems } = obj(fdo);

  if(data)
    return data;

  throw problems;
}
