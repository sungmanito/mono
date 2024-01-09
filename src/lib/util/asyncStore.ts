import {
  writable,
  readable,
  type Readable,
  type Writable,
  type StartStopNotifier,
} from 'svelte/store';

/**
 *
 * @param initial Initial value to set into the store
 * @param fn a function that returns a promise of the value you want to set the store to
 * @returns A read-only store.
 */
export function asyncReadableStore<R>(
  initial: R,
  fn: (set: Parameters<StartStopNotifier<R>>[0]) => Promise<R>,
): Readable<R> {
  const store = readable(initial, (set) => {
    fn(set)
      .then((r) => (r !== undefined ? set(r) : void 0))
      .catch(console.error);
  });

  return store;
}

/**
 *
 * @param initial Initial values for the store
 * @param fn a function, which is passed a "set" parameter.
 * @returns
 */
export function asyncWritableStore<R>(
  initial: R,
  fn: (set: Parameters<StartStopNotifier<R>>[0]) => Promise<R>,
): Writable<R> {
  const store = writable(initial, (set) => {
    fn(set)
      .then((r) => (r !== undefined ? set(r) : void 0))
      .catch(console.error);
  });
  return store;
}

// WIP
export function asyncStore() {
  const subscribers = new Set();

  return {
    subscribe: (fn: (v: unknown) => void | Promise<void>) =>
      subscribers.add(fn),
  };
}
