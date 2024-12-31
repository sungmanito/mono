<script lang="ts" module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Dropzone from './dropzone.svelte';

  const { Story } = defineMeta({
    title: 'Dropzone',
    component: Dropzone,
    tags: ['autodocs'],
  });
</script>

{#snippet defaultChildren()}
  Drag an image over me
{/snippet}

{#snippet dragover()}
  I am shown when something is being dragged over the item
{/snippet}

<Story name="Default" args={{ children: defaultChildren }} />

<Story name="With Dragover" args={{ children: defaultChildren, dragover }} />
