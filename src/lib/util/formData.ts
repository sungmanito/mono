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
  const obj: Record<string, FormDataEntryValue> = {};
  for(const [key, value] of fd.entries()) {
    if(filterFn([key, value])) {
      obj[key] = value;
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
export function formDataValidObject<T extends Type<R>, R = any>(fd: FormData, obj: T, filterFn?: FilterFn): R {
  const fdo = formDataToObject(fd, filterFn);
  const { data, problems } = obj(fdo);

  if(data)
    // @ts-expect-error I don't care enough about this to fight with it.
    return data;

  throw problems;
}
