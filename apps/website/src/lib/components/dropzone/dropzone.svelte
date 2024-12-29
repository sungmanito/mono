<script lang="ts" module>
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  export interface DropzoneProps extends HTMLAttributes<HTMLDivElement> {
    name?: string;
    accept?: string;
    dragover?: Snippet<[]>;
    ondrop?: (e: DragEvent, items: DataTransferItemList) => void;
  }
</script>

<script lang="ts">
  import type { EventHandler } from 'svelte/elements';
  let {
    name = 'dropped',
    accept = 'image/*',
    ...rest
  }: DropzoneProps = $props();
  // export let name = 'dropped';
  // export let accept = 'image/*';

  let count = 1;
  let hasDragOver = $state(false);
  const arr = $derived(Array.from({ length: count }));

  const onDragExit: EventHandler<DragEvent, HTMLDivElement> = (e) => {
    e.preventDefault();
    hasDragOver = false;
    rest?.ondragexit?.(e);
  };

  const onDragOver: EventHandler<DragEvent, HTMLDivElement> = (e) => {
    e.preventDefault();
    hasDragOver = true;
    rest?.ondragover?.(e);
  };

  const onDrop: EventHandler<DragEvent, HTMLDivElement> = (e) => {
    e.preventDefault();
    hasDragOver = false;
    if (e.dataTransfer) rest?.ondrop?.(e, e.dataTransfer.items || []);
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
      {#if rest.dragover}
        {@render rest.dragover()}
      {:else}
        You can drop items here
      {/if}
    </div>
  {/if}
  <!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
  {#each arr as _}
    <input type="file" {name} class="hidden" {accept} />
  {/each}
  {#if rest.children}
    {@render rest.children()}
  {/if}
</div>

<style>
  .dropzone * {
    pointer-events: none;
  }
</style>
