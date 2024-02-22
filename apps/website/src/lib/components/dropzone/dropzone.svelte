<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { EventHandler } from 'svelte/elements';
  export let name = 'dropped';
  export let accept = 'image/*';

  const dispatch = createEventDispatcher();

  let count = 1;
  let hasDragOver = false;
  $: arr = Array.from({ length: count });

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
  on:drop={onDrop}
  on:dragover={onDragOver}
  on:dragleave={onDragExit}
  on:dragend={onDragExit}
>
  {#if hasDragOver}
    <div
      class="absolute top-0 bottom-0 left-0 right-0 text-on-surface-token bg-surface-50-900-token flex items-center justify-center"
    >
      <slot name="drag-over">You can drop items here</slot>
    </div>
  {/if}
  {#each arr as _}
    <input type="file" {name} class="hidden" {accept} />
  {/each}
  <slot />
</div>

<style>
  .dropzone * {
    pointer-events: none;
  }
</style>
