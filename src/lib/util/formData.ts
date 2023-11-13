
type EntriesTouple = [string, FormDataEntryValue];

type FilterFn = (a: EntriesTouple) => boolean;

// TODO: get this to be something a bit more robust, perhaps utilizing some sort of field testing / mapping?
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