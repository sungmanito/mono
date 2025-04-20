<script lang="ts" module>
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes, HTMLInputAttributes } from 'svelte/elements';
  export interface DropzoneProps
    extends Omit<HTMLAttributes<HTMLDivElement>, 'ondrop' | 'onchange'> {
    name?: string;
    accept?: string;
    dragover?: Snippet<[DataTransferItemList | null]>;
    ondrop?: (e: DragEvent, items: DataTransferItemList) => void;
    /** @description This is for the generated input elements based on file selections. */
    onchange?: HTMLInputAttributes['onchange'];
    files?: FileList;
  }
</script>

<script lang="ts">
  import type { EventHandler } from 'svelte/elements';
  let {
    name = 'dropped',
    accept = 'image/*',
    files = $bindable(),
    ...rest
  }: DropzoneProps = $props();

  let count = $state(1);
  let hasDragOver = $state(false);
  let dropoverItems: DataTransferItemList | null = $state(null);

  const arr = $derived(Array.from({ length: count }));

  const onDragExit: EventHandler<DragEvent, HTMLDivElement> = (e) => {
    e.preventDefault();
    hasDragOver = false;
    rest?.ondragexit?.(e);
  };

  const onDragOver: EventHandler<DragEvent, HTMLDivElement> = (e) => {
    e.preventDefault();
    hasDragOver = true;
    dropoverItems = e.dataTransfer?.items || null;
    rest?.ondragover?.(e);
  };

  const onDrop: EventHandler<DragEvent, HTMLDivElement> = (e) => {
    e.preventDefault();
    hasDragOver = false;
    if (e.dataTransfer) {
      rest?.ondrop?.(e, e.dataTransfer.items || []);
    }
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
        {@render rest.dragover(dropoverItems)}
      {:else}
        You can drop items here
      {/if}
    </div>
  {/if}
  <!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
  {#each arr as _}
    <input
      type="file"
      bind:files
      {name}
      class="hidden"
      {accept}
      onchange={rest?.onchange}
    />
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
