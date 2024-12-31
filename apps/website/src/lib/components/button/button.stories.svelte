<script lang="ts" module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Button from './button.svelte';

  const { Story } = defineMeta({
    title: 'Button',
    component: Button,
    tags: ['autodocs'],
  });
</script>

{#snippet button()}
  Button
{/snippet}

<Story name="Default" args={{ children: button }} />
