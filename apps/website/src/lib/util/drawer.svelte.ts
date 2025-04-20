export function makeShowDrawerUtil(initialUrl = '', initialState = false) {
  const state = $state({
    url: initialUrl,
    show: false,
  });
  return state;
}
