/**
 *
 * @param initialUrl the initial url you want to track for the drawer or modal
 * @param initialState Does this default to open or not?
 * @returns
 */
export function makeShowDrawerUtil(initialUrl = '', initialState = false) {
  const state = $state({
    url: initialUrl,
    show: initialState,
  });
  return state;
}
