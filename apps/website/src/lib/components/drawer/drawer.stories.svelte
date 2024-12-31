<script lang="ts" module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Drawer from './drawer.svelte';

  const { Story } = defineMeta({
    title: 'Drawer',
    component: Drawer,
    tags: ['autodocs'],
    args: {
      open: true,
    },
  });
</script>

{#snippet children()}
  <div class="p-4">I am the content</div>
{/snippet}

<Story name="Default" args={{ children }} />
