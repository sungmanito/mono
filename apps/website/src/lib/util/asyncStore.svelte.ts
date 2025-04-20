export type StoreReturnType<T, E> =
  | {
      isSuccess: true;
      data: T;
      isLoading: boolean;
      isError: false;
      error: null;
    }
  | {
      isSuccess: false;
      data: null;
      isError: true;
      error: E;
      isLoading: boolean;
    };
export function asyncStore<T, E>(
  asyncFn: () => Promise<T>,
): StoreReturnType<T, E> {
  let data: T | null = $state(null);
  let error: E | null = $state(null);
  let isLoading = $state(true);
  let isSuccess = $state(false);
  let isError = $state(false);

  asyncFn()
    .then((d) => {
      isSuccess = true;
      data = d;
    })
    .catch((e) => {
      error = e as E;
      isError = true;
    })
    .finally(() => {
      isLoading = false;
    });

  return {
    get data() {
      return data;
    },
    get error() {
      return error;
    },
    get isLoading() {
      return isLoading;
    },
    get isError() {
      return isError;
    },
    get isSuccess() {
      return isSuccess;
    },
  };
}
