<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { EventHandler } from 'svelte/elements';
  interface Props {
    name?: string,
    accept?: string,
    drag_over?: import('svelte').Snippet,
    children?: import('svelte').Snippet
  }

  let {
    name = 'dropped',
    accept = 'image/*',
    drag_over,
    children
  }: Props = $props();

  const dispatch = createEventDispatcher();

  let count = 1;
  let hasDragOver = $state(false);
  let arr = $derived(Array.from({ length: count }));

  const onDragExit: EventHandler<DragEvent, HTMLDivElement> = (e) => {
    e.preventDefault();
    hasDragOver = false;
    dispatch('dragexit', e);
  };

  const onDragOver: EventHandler<DragEvent, HTMLDivElement> = (e) => {
    e.preventDefault();
    hasDragOver = true;
    dispatch('dragover', e);
  };

  const onDrop: EventHandler<DragEvent, HTMLDivElement> = (e) => {
    e.preventDefault();
    hasDragOver = false;
    if (e.dataTransfer) dispatch('drop', e.dataTransfer.items);
  };
</script>

<div
  class="dropzone p-2 border rounded relative"
  class:border-dashed={hasDragOver}
  class:border-blue-500={hasDragOver}
  aria-dropeffect="copy"
  role="form"
  ondrop={onDrop}
  ondragover={onDragOver}
  ondragleave={onDragExit}
  ondragend={onDragExit}
>
  {#if hasDragOver}
    <div
      class="absolute top-0 bottom-0 left-0 right-0 text-on-surface-token bg-surface-50-900-token flex items-center justify-center"
    >
      {#if drag_over}{@render drag_over()}{:else}You can drop items here{/if}
    </div>
  {/if}
  <!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
  {#each arr as _}
    <input type="file" {name} class="hidden" {accept} />
  {/each}
  {@render children?.()}
</div>

<style>
  .dropzone * {
    pointer-events: none;
  }
</style>
