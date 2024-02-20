import { describe, it, expect, vi } from 'vitest';
import { asyncReadable, asyncStore } from './asyncStore';
import { get } from 'svelte/store';

function waitFor(timeout: number) {
  return new Promise((res) => {
    setTimeout(() => {
      res(true);
    }, timeout);
  });
}

describe('V2', () => {
  it('Works without init function', () => {
    const store = asyncStore(0);
    const s1 = vi.fn();
    store.subscribe(s1);
    expect(s1).toHaveBeenCalledTimes(1);
    store.update(1);
    expect(s1).toHaveBeenCalledTimes(2);
  });

  it('Works with an init function', async () => {
    const store = asyncStore(0, async (set) => {
      await waitFor(10);
      set(100);
    });

    const s1 = vi.fn();
    store.subscribe(s1);
    await waitFor(11);
    expect(s1).toHaveBeenLastCalledWith(100);
  });

  it('Listens to the eager loading', async () => {
    const store = asyncStore(
      0,
      async (set) => {
        await waitFor(10);
        set(10);
      },
      {
        eagerLoad: true,
      },
    );
    await waitFor(11);
    const current = get(store);
    expect(current).toBe(10);

    const store2 = asyncStore(0, async (set) => {
      await waitFor(10);
      set(10);
    });
    expect(get(store2)).toBe(0);
    await waitFor(11);
    expect(get(store2)).toBe(10);
  });

  it('Listens to unsubscribing', () => {
    const store = asyncStore(0, (set) => set(10));
    const s1 = vi.fn();
    const s2 = vi.fn();
    const sub = store.subscribe(s1);
    store.subscribe(s2);
    expect(s1).toHaveBeenCalledTimes(2);
    // Release subscription
    sub();
    store.update(3);
    expect(s1).toHaveBeenCalledTimes(2);
    expect(s2).toHaveBeenCalledTimes(2);
  });

  it('Updates asynchronously', async () => {
    const store = asyncStore(0);
    const s1 = vi.fn();
    store.subscribe(s1);
    store.updateAsync(async ({ current, set }) => {
      await waitFor(10);
      set(current + 1);
    });

    await waitFor(11);
    expect(s1).toHaveBeenCalledWith(1);
  });
});

describe('asyncReadable', () => {
  it('Does not allow you to update a value outside the init function', () => {
    const init = vi.fn();
    const store = asyncReadable(0, init);
    // @ts-expect-error testing to see that this method does not exist on the object at runtime
    expect(() => store.update(10)).toThrow();
    expect(get(store)).toBe(0);
  });

  it('Works for the initial load function', () => {
    const init = vi.fn();
    const store = asyncReadable(0, init);
    const s1 = vi.fn();
    store.subscribe(s1);
    expect(init).toHaveBeenCalledTimes(1);
    expect(s1).toHaveBeenCalledTimes(1);
  });

  it('Works for the initial reload', async () => {
    const store = asyncReadable(
      0,
      async (set) => {
        await waitFor(10);
        set(10);
      },
      { allowReload: true },
    );

    const s1 = vi.fn();
    store.subscribe(s1);
    await waitFor(11);

    expect(s1).toHaveBeenCalledTimes(2);
    store.reload();
    await waitFor(11);
    expect(s1).toHaveBeenCalledTimes(3);
  });
});

/**
 * What i want is to be able to do something like
 * const store = asyncStore(0, async (set) => {set(10)});
 *
 * $: store.updateAsync(async ({ current, set }) => { set(current + 1) });
 *
 * // in svelte
 *
 * {#await $store}
 * Store value is {$store}
 * {/await}
 *
 */
