import { writable, readable, type Readable, type Writable } from 'svelte/store';

export function asyncReadableStore<R>(initial: R, fn: () => Promise<R>): Readable<R> {

  const store = readable(initial, set => {
    fn()
      .then(r => set(r))
      .catch(console.error);
  });

  return store;
}

export function asyncWritableStore<R>(initial: R, fn: () => Promise<R>): Writable<R> {
  const store = writable(initial, set => {
    fn()
      .then(r => set(r))
      .catch(console.error);
  });
  return store;
}