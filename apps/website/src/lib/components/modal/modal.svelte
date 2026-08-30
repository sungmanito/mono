<script lang="ts" module>
  export interface ModalProps
    extends Omit<HTMLAttributes<HTMLDialogElement>, 'children'> {
    open?: boolean;
    modal?: boolean;
    onclose: () => void;
    children: Snippet<[{ close: () => void }]>;
    header?: Snippet<[{ close: () => void }]>;
    footer?: Snippet<[{ close: () => void }]>;
    baseClasses?: string;
  }
</script>

<script lang="ts">
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

  // Funnel every way the <dialog> can close — native method="dialog"
  // submission, Escape, or an explicit modalElement.close() — through the
  // single onclose path. The `open` guard skips the echo when the close was
  // driven by the parent setting `open` to false (the effect above).
  function handleNativeClose() {
    if (open) {
      onclose();
    }
  }
</script>

<dialog
  class={cx(rest.class, baseClasses)}
  bind:this={modalElement}
  onclose={handleNativeClose}
>
  <form method="dialog" class="flex flex-col gap-4">
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
        onclick={() => onclose()}
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
        <button
          type="button"
          class="btn variant-filled-primary"
          onclick={() => onclose()}
        >
          Close
        </button>
      {/if}
    </footer>
  </form>
</dialog>
