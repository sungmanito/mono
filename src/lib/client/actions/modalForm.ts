import { invalidateAll } from '$app/navigation';
import type { Action } from 'svelte/action';

async function sendFormData(e: SubmitEvent) {
  // Stop the default event
  e.preventDefault();
  // Grab the form
  const form = e.target as HTMLFormElement;
  // Grab the form action
  const action = form.action;
  // Grab the method
  const method = form.method || 'POST';
  // Collect the form data
  const formData = new FormData(form);

  // Send the data, accepting JSON data in response
  const serverResponse = await fetch(action, {
    method,
    headers: new Headers({
      accept: 'application/json',
    }),
    body: formData,
  });

  // If the server comes back correct, send all the data back
  if (
    serverResponse.ok &&
    serverResponse.status < 400 &&
    serverResponse.status >= 200
  ) {
    invalidateAll();
  }

  // Output stuff, I guess?
}

export const modalForm: Action<HTMLFormElement> = (form) => {
  form.addEventListener('submit', sendFormData);

  return {
    destroy() {},
  };
};
