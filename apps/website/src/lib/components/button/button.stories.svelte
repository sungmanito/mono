<script lang="ts" module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { within, expect, fireEvent, fn } from '@storybook/test';
  import Button from './button.svelte';

  const mockClick = fn();

  const { Story } = defineMeta({
    title: 'Button',
    component: Button,
    tags: ['autodocs'],
    args: {
      onclick: mockClick,
    },
  });
</script>

{#snippet button()}
  Button
{/snippet}

<Story
  name="Default"
  args={{ children: button }}
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    fireEvent.click(canvas.getByRole('button', { name: 'Button' }));
    await expect(mockClick).toHaveBeenCalledOnce();
  }}
/>

<Story name="Variant colors" args={{ children: button, variant: 'secondary' }}>
  <!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
  {#snippet children({ size: _, ...args })}
    <div class="py-4">Change the selected variant in the "Controls" tab</div>
    <div class="flex items-center gap-3">
      <Button {...args} size="sm">{@render button()}</Button>
      <Button {...args} size="md">{@render button()}</Button>
      <Button {...args} size="lg">{@render button()}</Button>
      <Button {...args} size="custom" class="p-10 text-4xl font-bold bg-sky-500"
        >{@render button()}&ndash; custom</Button
      >
    </div>
  {/snippet}
</Story>
