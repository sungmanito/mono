<script lang="ts" module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Dropzone from './dropzone.svelte';

  const { Story } = defineMeta({
    title: 'Dropzone',
    component: Dropzone,
    tags: ['autodocs'],
  });

  function ondragstart(e: DragEvent) {
    if (e.target && e.target instanceof HTMLElement) {
      e.dataTransfer?.setData('text', e.target.dataset['color'] || '');
    }
  }

  let color: string = $state('');
</script>

{#snippet defaultChildren()}
  Drag an image over me
{/snippet}

{#snippet dragover()}
  I am shown when something is being dragged over the item
{/snippet}

<Story name="Default" args={{ children: defaultChildren }} />

<Story name="With Dragover" args={{ children: defaultChildren, dragover }} />

<Story name="Kitchen Sink">
  {#snippet children()}
    <div class="flex gap-4" data-testid="color-header">
      <div
        class="draggable"
        draggable="true"
        role="note"
        data-color="#fef03f"
        {ondragstart}
      >
        Yellow Color
      </div>
      <div
        class="draggable"
        data-color="#ee1009"
        {ondragstart}
        draggable="true"
        role="note"
      >
        Red color
      </div>
    </div>

    <Dropzone
      ondrop={(e, i) => {
        console.info(e, i);
        const id = e.dataTransfer?.getData('text');
        if (id) color = id;
      }}
    >
      {#snippet dragover()}
        <div class="text-token">I am shown on dragover</div>
      {/snippet}
      <div class="flex border border-blue-400 p-3">
        {#if color !== ''}
          <div class="h-10 w-10" style={`background-color: ${color}`}>
            {color}
          </div>
        {:else}
          Drag and drop elements here
        {/if}
      </div>
    </Dropzone>
  {/snippet}
</Story>
