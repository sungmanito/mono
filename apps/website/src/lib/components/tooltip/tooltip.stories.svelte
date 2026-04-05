<script lang="ts" module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { expect, userEvent } from '@storybook/test';
  import Tooltip from './tooltip.svelte';

  const { Story } = defineMeta({
    title: 'Tooltip',
    component: Tooltip,
    tags: ['autodocs'],
    args: {
      trigger,
      content: hint,
      placement: 'bottom',
    },
  });
</script>

{#snippet trigger(_id: string)}
  <button>Hover me</button>
{/snippet}

{#snippet hint(_id: string)}
  Helpful tooltip content
{/snippet}

{#snippet longContent(_id: string)}
  <p>Lorem ipsum dolor sit amet consectetur adipisicing elit.</p>
  <p>
    Repellendus nulla, cum sint enim tenetur corrupti minima repellat magni?
  </p>
  <p>Sunt numquam expedita accusamus sed id assumenda dicta dignissimos hic.</p>
{/snippet}

<!-- Default: verifies the popover opens, has content, and closes -->
<Story
  name="Default"
  play={async ({ canvasElement }) => {
    const popover = canvasElement.querySelector<HTMLElement>('[popover]')!;

    await expect(popover).not.toBeVisible();

    popover.showPopover();
    await expect(popover).toBeVisible();
    await expect(popover).toHaveTextContent('Helpful tooltip content');

    popover.hidePopover();
    await expect(popover).not.toBeVisible();
  }}
/>

<!-- Interaction: hover and unhover cycle -->
<Story
  name="Trigger interaction"
  play={async ({ canvasElement }) => {
    const button = canvasElement.querySelector<HTMLElement>('button')!;
    const popover = canvasElement.querySelector<HTMLElement>('[popover]')!;

    await expect(popover).not.toBeVisible();

    await userEvent.hover(button);
    await expect(popover).toBeVisible();

    await userEvent.unhover(button);
    await expect(popover).not.toBeVisible();
  }}
/>

<!-- Long content: multi-line body stays readable -->
<Story name="Long content" args={{ content: longContent }} />

<!-- Placements — vertical -->
<Story name="Bottom" args={{ placement: 'bottom' }} />
<Story name="Bottom start" args={{ placement: 'bottom-start' }} />
<Story name="Bottom end" args={{ placement: 'bottom-end' }} />
<Story name="Top" args={{ placement: 'top' }} />
<Story name="Top start" args={{ placement: 'top-start' }} />
<Story name="Top end" args={{ placement: 'top-end' }} />

<!-- Placements — horizontal -->
<Story name="Right" args={{ placement: 'right', content: longContent }} />
<Story name="Right start" args={{ placement: 'right-start' }} />
<Story name="Right end" args={{ placement: 'right-end' }} />
<Story name="Left" args={{ placement: 'left' }} />
<Story name="Left start" args={{ placement: 'left-start' }} />
<Story name="Left end" args={{ placement: 'left-end' }} />
<Story name="With button">
  {#snippet template({ trigger, content, ...args })}
    <div class="flex items-center justify-center w-full h-screen">
      <Tooltip {...args}>
        {#snippet trigger()}
          <button class="p-2 rounded-full border">13</button>
        {/snippet}
        {#snippet content()}
          I am the content
        {/snippet}
      </Tooltip>
    </div>
  {/snippet}
</Story>
