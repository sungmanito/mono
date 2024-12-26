<script lang="ts" module>
  export interface ModalProps
    extends Omit<HTMLAttributes<HTMLDialogElement>, 'children'> {
    open?: boolean;
    modal?: boolean;
    onclose: () => void;
    children: Snippet<[{ close: () => void }]>;
    header?: Snippet<[{ close: () => void }]>;
    footer?: Snippet<[{ close: () => void }]>;
    action?: string;
    submitFn?: (response: Response) => Promise<unknown>;
    baseClasses?: string;
  }
</script>

<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { cx } from 'class-variance-authority';
  import { XIcon } from 'lucide-svelte';
  import { type Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    open = $bindable(false),
    onclose = () => void 0,
    children,
    header,
    footer,
    modal,
    action = '/',
    submitFn = () => Promise.resolve(void 0),
    baseClasses = 'modal bg-surface-100-800-token p-4 rounded-lg shadow-md shazdow-zinc-100 min-h-12 text-surface-800-100-token',
    ...rest
  }: ModalProps = $props();

  let modalElement: HTMLDialogElement = $state();

  $effect(() => {
    if (open && modal && modalElement) {
      modalElement.showModal();
    }
  });

  $effect(() => {
    if (open && !modal && modalElement) {
      modalElement.show();
    }
  });

  $effect(() => {
    if (!open && modalElement) {
      modalElement.close();
    }
  });

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
      onclose();
    }
  }
</script>

<dialog class={cx(rest.class, baseClasses)} bind:this={modalElement}>
  <form
    method="dialog"
    class="flex flex-col gap-4"
    {action}
    onsubmit={submitForm}
  >
    <header class="flex justify-between">
      <div>
        {#if header}
          {@render header({ close: () => onclose() })}
        {/if}
      </div>
      <button
        type="button"
        class="btn-icon btn-icon-sm"
        title="Close Modal"
        onclick={() => {
          modalElement.close();
          onclose();
        }}
      >
        <XIcon size="1em" />
      </button>
    </header>
    <section>
      {@render children({ close: onclose })}
    </section>
    <footer>
      {#if footer}
        {@render footer({ close: onclose })}
      {:else}
        <button class="btn variant-filled-primary" onclick={() => onclose()}>
          Close
        </button>
      {/if}
    </footer>
  </form>
</dialog>
