<script lang="ts" module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Package2Icon, PersonStandingIcon } from 'lucide-svelte';
  import ButtonGroup from './buttonGroup.svelte';

  const { Story } = defineMeta({
    title: 'Components/Button Group',
    component: ButtonGroup,
    tags: ['autodocs'],
  });

  let fn = $state('Option 1');
  let customOpts = [
    { label: 'Test', icon: Package2Icon },
    { label: 'Test 2', icon: PersonStandingIcon },
  ];
  let withChildrenSnippet = $state({
    options: customOpts,
    active: customOpts[0],
  });
</script>

<Story
  name="Default"
  args={{ options: ['Button 1', 'Button 2', 'Button 3'] }}
/>

<Story
  name="Using Options"
  args={{
    options: ['Option 1', 'Option 2', 'Option 3'] as const,
    active: 'Option 2',
  }}
/>

<Story name="With things">
  {#snippet children()}
    <div class="flex flex-col gap-2">
      <h3 class="h3">Current active element: {fn}</h3>
      <ButtonGroup
        options={['Option 1', 'Option 2', 'Option 3']}
        bind:active={fn}
      />
    </div>
  {/snippet}
</Story>

<Story name="With children snippet">
  {#snippet children()}
    <ButtonGroup>
      {#snippet children()}
        {#each withChildrenSnippet.options as opt}
          <button
            class={[
              'btn-icon-lg',
              { 'variant-filled-tertiary': withChildrenSnippet.active === opt },
            ]}
            aria-label={opt.label}
            onclick={() => {
              withChildrenSnippet.active = opt;
            }}
          >
            <opt.icon size="1em" />
          </button>
        {/each}
      {/snippet}
    </ButtonGroup>
  {/snippet}
</Story>

<Story
  name="With Mixed options"
  args={{
    options: [
      { label: 'Option 2', value: 'Option 2', id: 'something' },
      { label: 'Option 3', id: 'something-2', value: 'fuck' },
    ] as const,
    active: 'Option 1',
    onchange: (value) => {
      console.info(value);
    },
  }}
/>
