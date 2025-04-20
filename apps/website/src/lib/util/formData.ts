/* eslint-disable @typescript-eslint/no-explicit-any,@typescript-eslint/no-unused-vars */
// eslint-disable-file
// TODO: Remove this and just use the package @jhechtf/arktype-utils
import type { Problems, Type } from 'arktype';
import { type } from 'arktype';

type EntriesTouple = [string, FormDataEntryValue];

type FilterFn = (a: EntriesTouple) => boolean;

type FormDataObjectEntry = FormDataEntryValue | number | boolean | bigint;

const nameKeyExtractor = /(?<name>.*)\[(?<index>.*)\]/;
const digitCheck = /^\d+$/;

type MagicObject = {
  readonly type: 'array' | 'object';
  add(key: string, value: string | File): void;
  toJS(): unknown[] | Record<string, unknown>;
};

function makeMagicObject(init: EntriesTouple[] = []): MagicObject {
  const entries: EntriesTouple[] = ([] as EntriesTouple[]).concat(init);
  return {
    get type() {
      if (entries.every(([k]) => digitCheck.test(k) || k === ''))
        return 'array';
      return 'object';
    },
    add(key: string, value: string | File) {
      entries.push([key, value]);
    },
    toJS() {
      // TODO: Figure out how to clean this up
      if (this.type === 'array') {
        const arr: unknown[] = [];
        for (const [k, v] of entries) {
          if (k === '')
            arr.push(typeof v === 'string' ? stringToJSValue(v) : v);
          else arr[Number(k)] = typeof v === 'string' ? stringToJSValue(v) : v;
        }
        return arr;
      }
      const ret: Record<string, unknown> = {};
      for (const [k, v] of entries)
        ret[k] = typeof v === 'string' ? stringToJSValue(v) : v;
      return ret;
    },
  };
}

/**
 *
 * @param fd the form data object
 * @param filterFn an optional filtering function to remove some values from the end object
 * @returns an object mapped from the entries.
 */
export function formDataToObject(
  fd: FormData,
  filterFn: FilterFn = () => true,
) {
  const ret: Record<string, unknown> = {};
  // Map of key name into magic type which converts its entries to either an object
  // or an array.
  const info = new Map<string, ReturnType<typeof makeMagicObject>>();
  // eslint-disable-next-line prefer-const
  for (let [iterator, value] of fd.entries()) {
    // If the key does not match this filter, continue the loop
    if (!filterFn([iterator, value])) continue;
    // run the iterator against the name key extractor
    const matches = iterator.match(nameKeyExtractor);
    // If we do not have matches, or the index match is empty, we go here.
    if (matches === null || matches[2] === '') {
      // Grab all of the values for the current iterator
      const all = fd.getAll(iterator);
      // If the length of all entries for this iterator is 1 AND the iterator name does not end
      // with [] (indicating the user wants this to be an array) we drop in here
      if (all.length === 1 && !iterator.endsWith('[]')) {
        // set the value on the return object
        ret[iterator] =
          typeof all[0] === 'string' ? stringToJSValue(all[0]) : all[0];
        // don't need the rest of the loop values here, so we forcibly continue
        continue;
      }
      // If the iterator includes an opening [], let's assume we don't want the `[]` to be included
      // so we trim it out here
      if (iterator.includes('['))
        iterator = iterator.slice(0, iterator.indexOf('['));

      // Set the iterator value on returned object
      ret[iterator] = all.map((v) =>
        typeof v === 'string' ? stringToJSValue(v) : v,
      );
    } else {
      // If we have matches, there's a bit more processing required
      const { groups } = matches;
      // Check to ensure our groups are there. It shouldn't be possible to have matches
      // without groups in modern JS, but c'est la vie
      if (groups === undefined) continue;
      // pull out the name and index. we add defaults so TS doesn't yell at us about possibly
      // being undefined
      const { name = '', index = '' } = groups;
      // Grab the magic item from the info map.
      let magic = info.get(name);
      // If we don't have a magic item, make one and set it
      if (!magic) {
        magic = makeMagicObject();
        info.set(name, magic);
      }

      magic.add(index, value);
    }
  }

  // Consolidation of items in the info values.
  for (const [key, magic] of info.entries()) {
    if (!ret[key]) ret[key] = magic.toJS();
    else console.error(`Key ${key} already exists in object.`);
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

type ExtractType<T extends Type<any>> = T extends Type<infer R> ? R : never;
export function validate<T extends Type<any>>(
  obj: unknown,
  filter: T,
): ExtractType<T> {
  const { data, problems } = filter(obj);
  if (data) return data;
  throw problems;
}

// Need to rename this function, don't have the energy to do it now.
export const validateFormData = formDataValidObject;
