export type AsyncSubscriberFn<T> = (v: T) => void | Promise<void>;
export type AsyncInitFn<T> = (set: (v: T) => void) => void | Promise<void>;
export type AsyncUpdate<T> = (context: {
  set: (v: T) => void;
  current: T;
}) => void | Promise<void> | T | Promise<T>;

export function asyncStore<T>(
  initialValue: T,
  initFn?: (set: (v: T) => void) => void | Promise<void>,
  { eagerLoad = false }: { eagerLoad?: boolean } = {},
) {
  const subscribers = new Set<AsyncSubscriberFn<T>>();
  const proxy = new Proxy<{ value: T }>(
    {
      value: initialValue,
    },
    {
      get(target, property) {
        if (property !== 'value') {
          return undefined;
        }
        return target[property];
      },
      set(target, property, value) {
        if (property !== 'value') {
          return false;
        }
        target[property] = value;
        notify();
        return true;
      },
    },
  );

  let isLoading = true;
  let isSuccess = false;

  const set = (v: T) => (proxy.value = v);

  if (eagerLoad && initFn) initFn((v) => (proxy.value = v));

  const notify = () => {
    for (const fn of subscribers.values()) {
      fn(proxy.value);
    }
  };

  return {
    subscribe: (fn: (v: T) => void | Promise<void>) => {
      // Add the subscribers to the list
      subscribers.add(fn);
      // If we are not eager loading, and we now have a subscriber, and an initFn is present
      // run the initFn
      if (!eagerLoad && subscribers.size === 1 && initFn) initFn(set);
      // Call the function with the current value as of subscribing
      fn(proxy.value);
      // Return the unsubscribe function
      return () => {
        subscribers.delete(fn);
      };
    },
    updateAsync: (fn: AsyncUpdate<T>) => {
      isLoading = true;
      const ret = fn({ current: proxy.value, set });
      if (ret !== undefined) {
        if (ret instanceof Promise) {
          ret.then((r) => {
            if (r !== undefined) {
              set(r);
            }
            isLoading = false;
          });
        } else {
          set(ret);
          isLoading = false;
        }
      }
    },
    update: set,
    get isLoading() {
      return isLoading;
    },
    get isSuccess() {
      return isSuccess;
    },
  };
}

export function asyncReadable<T>(
  initial: T,
  initFn: AsyncInitFn<T>,
  {
    eagerLoad = false,
    allowReload = true,
  }: { eagerLoad?: boolean; allowReload?: boolean } = {},
) {
  const store = asyncStore(initial, initFn, { eagerLoad });
  return {
    isLoading: store.isLoading,
    isSuccess: store.isSuccess,
    subscribe: store.subscribe,
    reload: () => {
      if (allowReload) {
        initFn((v) => store.update(v));
      }
    },
  };
}
