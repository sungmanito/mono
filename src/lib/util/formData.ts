/* eslint-disable @typescript-eslint/no-explicit-any,@typescript-eslint/no-unused-vars */
// eslint-disable-file
import type { Problems, Type } from 'arktype';

type EntriesTouple = [string, FormDataEntryValue];

type FilterFn = (a: EntriesTouple) => boolean;

type FormDataObjectEntry = FormDataEntryValue | number | boolean | bigint;

/**
 *
 * @param fd the form data object
 * @param filterFn an optional filtering function to remove some values from the end object
 * @param pruneKeyNames if true, then the keynames matching the pattern of `key[]` will be pruned down to just
 * `key` in the resulting object
 * @returns an object mapped from the entries.
 */
export function formDataToObject(
  fd: FormData,
  filterFn: FilterFn = () => true,
  pruneKeyNames = true,
): Record<string, FormDataObjectEntry | FormDataObjectEntry[]> {
  const ret: Record<string, FormDataObjectEntry | FormDataObjectEntry[]> = {};

  for (let key of fd.keys()) {
    if (filterFn([key, ''])) {
      const all = fd.getAll(key);

      if (all.length === 1) {
        // regular stuff
        ret[key] =
          typeof all[0] === 'string' ? stringToJSValue(all[0]) : all[0];
      } else {
        if (pruneKeyNames && /\[.?\]/.test(key)) {
          key = key.replace(/\[.?\]/, '');
        }
        ret[key] = all.map((v) =>
          typeof v === 'string' ? stringToJSValue(v) : v,
        );
      }
    }
  }

  return ret;
}

// Sometimes Files are weenies
type NonFileFormEntries<T> = T extends File ? never : T;

/**
 * @todo Remove the FormDataEntryValue from this return type. That code is not handled here
 * @param str a string value to be turned into a JS value
 * @returns
 */
function stringToJSValue(str: string): NonFileFormEntries<FormDataObjectEntry> {
  if (/^(?:\+|-)?\d+(?:\.\d+)?$/.test(str) && str < '9007199254740991') {
    return Number(str);
  }

  if (/^true|false$/.test(str)) return str === 'true';

  if (/^\d+n$/.test(str) || (str > '9007199254740991' && /^\d+$/.test(str)))
    return BigInt(str.charAt(str.length - 1) === 'n' ? str.slice(0, -1) : str);

  return str;
}

/**
 *
 * @param fd Form Data object
 * @param obj an ArkType type validator
 * @param filterFn Filter function to run when creating the form data object
 * @throws {Problems}
 * @returns
 */
export function formDataValidObject<T extends Type<any>>(
  fd: FormData,
  obj: T,
  filterFn?: FilterFn,
): T extends Type<infer R> ? R : any {
  const fdo = formDataToObject(fd, filterFn);
  const { data, problems } = obj(fdo);

  if (data) return data;

  throw problems;
}

// Need to rename this function, don't have the energy to do it now.
export const validateFormData = formDataValidObject;
