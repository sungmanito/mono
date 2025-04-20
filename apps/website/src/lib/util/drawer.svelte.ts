export function makeShowDrawerUtil(initialUrl = '', initialState = false) {
  const state = $state({
    url: initialUrl,
    show: initialState,
  });
  return state;
}
