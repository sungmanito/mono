<script lang="ts" module>
  import Button from '$components/button/button.svelte';
  import Card from './card.svelte';
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { PencilIcon } from 'lucide-svelte';
  const { Story } = defineMeta({
    title: 'Components/Cards',
    component: Card,
    args: {
      children: defaultChildren,
    },
    tags: ['autodocs'],
  });
</script>

{#snippet defaultChildren()}
  <div class="p-4">Card content</div>
{/snippet}

<Story
  name="Default"
  parameters={{
    docs: {
      description: {
        story: 'your mother',
      },
    },
  }}
/>

<Story name="Summary Card" asChild>
  <Card
    headerClasses="justify-between flex pb-4 items-center"
    class="w-1/5 variant-filled-surface text-on-surface-token"
  >
    {#snippet header()}
      <div>Summary info</div>
      <div>
        <PencilIcon size="1em" />
      </div>
    {/snippet}
    <div class="p-4 text-center text-3xl font-bold">0</div>
  </Card>
</Story>

<Story name="Card with Image" asChild>
  <Card overrideClasses={{ header: true }} class="w-2/5">
    {#snippet header()}
      <img
        src="https://placekittens.com/600/400"
        alt="Placekitten"
        class="w-full h-auto rounded-tl-container-token rounded-tr-container-token"
      />
    {/snippet}

    {#snippet footer()}
      <div class="flex gap-4 border-t pt-4 border-surface-400">
        <Button>Adopt</Button>
      </div>
    {/snippet}

    <div class="p-4">This is Whiskers. He's a wanted criminal in 7 states.</div>
  </Card>
</Story>
