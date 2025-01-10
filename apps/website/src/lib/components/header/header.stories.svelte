<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { expect, within } from '@storybook/test';
  import Header from './header.svelte';

  // More on how to set up stories at: https://storybook.js.org/docs/writing-stories
  const { Story } = defineMeta({
    title: 'Header',
    component: Header,
    tags: ['autodocs'],
  });
</script>

{#snippet child()}
  Header Text
{/snippet}

{#snippet actions()}
  <button class="bg-blue-400 p-2 rounded-full">Action 1</button>
  <button class="bg-zinc-400 p-2 rounded-full">Action 2</button>
{/snippet}

<!-- More on writing stories with args: https://storybook.js.org/docs/writing-stories/args -->
<Story
  name="Default"
  args={{ children: child }}
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Header Text')).toBeInTheDocument();
  }}
/>

<Story
  name="With Action"
  args={{ children: child, actions }}
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('button')).toHaveLength(2);
    const buttons = canvas.getAllByRole('button');
    for (const [i, button] of buttons.entries()) {
      expect(button).toHaveTextContent(`Action ${i + 1}`);
    }
  }}
/>
