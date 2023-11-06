<script lang="ts">
  import { XIcon } from 'lucide-svelte';
  import { createEventDispatcher } from 'svelte';
  import { cx } from 'class-variance-authority';

  export let open = false;
  export let modal = false;

  export let action = '/';

  const dispatchEvent = createEventDispatcher();

  let modalElement: HTMLDialogElement;

  $: if(open && modal && modalElement) {
    modalElement.showModal();
  }

  $: if(open && !modal && modalElement) {
    modalElement.show();
  }

  $: if(!open && modalElement) {
    modalElement.close();
  }
</script>

<dialog class={cx($$props.class)} bind:this={modalElement}>
  <form method="dialog" class="flex flex-col gap-4" action={action}>
    <header class="flex justify-between">
      <div>
        <slot name="header"></slot>
      </div>
      <div>
        <XIcon size="1em"/>
      </div>
    </header>
    <section>
      <slot />
    </section>
    <footer>
      <slot name="footer">
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