<script lang="ts" module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { AlertTriangleIcon, XIcon } from 'lucide-svelte';
  import Alert from './alert.svelte';
  const { Story } = defineMeta({
    title: 'Alerts',
    component: Alert,
    tags: ['autodocs'],
    args: {
      type: 'default',
    },
    argTypes: {
      type: {
        control: {
          type: 'radio',
          options: ['primary'],
        },
      },
    },
  });
</script>

<Story name="Default">
  {#snippet children(args)}
    <Alert {...args}>
      <div class="flex items-center gap-6">
        <AlertTriangleIcon size="2em" /> Alert without thingamajig
      </div>
      {#snippet actions()}
        <button class="hover:rounded-full hover:bg-secondary-hover-token p-2">
          <XIcon size="1.5em" />
        </button>
      {/snippet}
    </Alert>
  {/snippet}
</Story>
