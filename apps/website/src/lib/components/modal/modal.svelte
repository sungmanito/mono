<script lang="ts">
  import { XIcon } from 'lucide-svelte';
  import { createEventDispatcher } from 'svelte';
  import { cx } from 'class-variance-authority';
  import { invalidateAll } from '$app/navigation';

  export let open = false;
  export let modal = false;
  export let submitFn: (response: Response) => Promise<unknown> = () =>
    Promise.resolve(void 0);

  export let action = '/';

  const dispatchEvent = createEventDispatcher();

  let modalElement: HTMLDialogElement;

  $: if (open && modal && modalElement) {
    modalElement.showModal();
  }

  $: if (open && !modal && modalElement) {
    modalElement.show();
  }

  $: if (!open && modalElement) {
    modalElement.close();
  }

  async function submitForm(
    e: SubmitEvent & { currentTarget: HTMLFormElement },
  ) {
    // Grab the action
    const action = e.currentTarget.action;

    // Get the current form data
    const formData = new FormData(e.currentTarget);

    // Send the form with this action
    const response = await fetch(action, {
      method: 'POST',
      body: formData,
    });

    // If the response is OK then we invalidate all of the data.
    if (response.ok) {
      if (submitFn) {
        await submitFn(response);
      }

      invalidateAll();
      e.currentTarget.reset();
      dispatchEvent('close');
    }
  }

  export let baseClasses =
    'modal bg-surface-100-800-token p-4 rounded-lg shadow-md shazdow-zinc-100 min-h-12 text-surface-800-100-token';
</script>

<dialog class={cx($$props.class, baseClasses)} bind:this={modalElement}>
  <form
    method="dialog"
    class="flex flex-col gap-4"
    {action}
    on:submit={submitForm}
  >
    <header class="flex justify-between">
      <div>
        <slot name="header" />
      </div>
      <button
        type="button"
        class="btn-icon btn-icon-sm"
        title="Close Modal"
        on:click={(e) => {
          modalElement.close();
          dispatchEvent('close', e);
        }}
      >
        <XIcon size="1em" />
      </button>
    </header>
    <section>
      <slot close={() => dispatchEvent('close')} />
    </section>
    <footer>
      <slot name="footer" close={() => dispatchEvent('close')}>
        <button
          class="btn variant-filled-primary"
          on:click={(e) => dispatchEvent('close', e)}
        >
          Close
        </button>
      </slot>
    </footer>
  </form>
</dialog>
