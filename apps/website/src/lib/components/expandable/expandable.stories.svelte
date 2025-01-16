<script lang="ts" module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Expandable, { type SlotProps } from './expandable.svelte';
  import { ChevronDownIcon } from 'lucide-svelte';
  import { within, expect, fireEvent } from '@storybook/test';
  import Button from '$lib/components/button/button.svelte';
  import Header from '$components/header/header.svelte';
  const { Story } = defineMeta({
    title: 'Expandable',
    component: Expandable,
    tags: ['autodocs'],
  });
</script>

{#snippet defaultHeader()}
  I am the default header
{/snippet}

{#snippet defaultChildren()}
  Children children
{/snippet}

{#snippet childWithCustomAction({ toggle }: SlotProps)}
  <p>
    Welcome to the expandable section. Here you can find detailed information
    and insights.
  </p>
  <ul>
    <li>Item 1: Comprehensive details on topic A.</li>
    <li>Item 2: Insights and updates on topic B.</li>
    <li>Item 3: Further readings and references.</li>
  </ul>

  <Button onclick={toggle}>Close</Button>
{/snippet}

<Story
  name="Default"
  args={{
    header: defaultHeader,
    children: defaultChildren,
  }}
/>

<Story
  name="Custom Toggle"
  args={{
    header: defaultHeader,
    children: childWithCustomAction,
  }}
/>

<Story
  name="Expandable Card"
  play={async ({ canvasElement }) => {
    const container = within(canvasElement);
    await fireEvent.click(container.getByRole('button'));
    await expect(
      container.getByLabelText('tests+e2e@sungmanito.app', { exact: false }),
    ).toBeInTheDocument();
    await fireEvent.click(container.getByLabelText('Collapse'));
    await expect(
      container.queryByText('tests+e2e@sungmanito.app', { exact: false }),
    ).toBeNull();
  }}
>
  {#snippet children()}
    <Expandable
      headerContainerClasses={['card-header', 'pb-4']}
      class="card variant-soft-surface"
      disableExpandButton={true}
    >
      {#snippet header({ toggle, open })}
        <div class="flex flex-col gap-4">
          <div class="flex justify-between border-surface">
            <strong>Super Cool Header</strong>
            <Button
              variant="custom"
              class="p-2 rounded-full"
              aria-label={open ? 'Collapse' : 'Expand'}
              onclick={toggle}
            >
              <ChevronDownIcon />
            </Button>
          </div>
          <div class="flex justify-between">
            <div>Members</div>
            <div>3</div>
          </div>
        </div>
      {/snippet}
      {#snippet children({ open })}
        <div class="p-4 flex flex-col gap-4">
          <hr />
          <div>
            <Header tag="h5" color="secondary">Members</Header>
          </div>
          <div class="flex justify-between">
            <div>test+e2e-shared@sungmanito.app</div>
            <div>Active</div>
          </div>
          <div class="flex justify-between">
            <div aria-label="tests+e2e@sungmanito.app">
              test+e2e@sungmanito.app
            </div>
            <div>Active</div>
          </div>
          <div>
            <Header tag="h5" color="secondary">Bills</Header>
          </div>
          <div class="flex justify-between">
            <div>Rent</div>
            <div>$1,300.00</div>
          </div>
          <div class="flex justify-between">
            <div>Internet</div>
            <div>$100.00</div>
          </div>
          <div class="flex justify-between">
            <div>
              <strong>Total</strong>
            </div>
            <div>$1,400.00</div>
          </div>
          <div class="flex justify-end gap-2">
            <Button>Edit</Button>
            <Button variant="destructive">Delete</Button>
          </div>
        </div>
      {/snippet}
    </Expandable>
  {/snippet}
</Story>
