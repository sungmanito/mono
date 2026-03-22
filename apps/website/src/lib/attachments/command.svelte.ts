import { formDataToObject } from '@jhecht/arktype-utils';
import type { Attachment } from 'svelte/attachments';
import type { RemoteCommand } from '@sveltejs/kit';

export type MaybePromise<T = void> = (() => T) | (() => Promise<T>);

export type Obj<T, U> = {
  fn: RemoteCommand<T, U>;
  validator?: (fd: FormData) => FormData;
  invalidator?: MaybePromise<void>;
};

type UseRemoteArgs<T, U> = RemoteCommand<T, U> | Obj<T, U>;

export const useRemote: <T, U>(
  arg: UseRemoteArgs<T, U>,
) => Attachment<HTMLFormElement> = (arg) => (form) => {
  const onSubmit = (e: SubmitEvent) => {
    e.preventDefault();
  };

  // Adds the submit function handler
  // Generates a form data object
  const fd = new FormData(form);

  // turn the form data into an object
  const obj = formDataToObject(fd);

  form.addEventListener('submit', onSubmit, true);

  return () => {
    // Removes the listener if the item is unmounted
    form.removeEventListener('submit', onSubmit);
  };
};

export const remote = () => {
  const b = new Promise((res) => {
    setTimeout(() => {
      res(1);
    }, 4000);
  });
  b.something = () => {
    console.info('hi jim');
  };
  return b;
};
