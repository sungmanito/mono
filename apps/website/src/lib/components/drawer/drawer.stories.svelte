<script lang="ts" module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { fn, within, expect, fireEvent, userEvent } from '@storybook/test';
  import Drawer from './drawer.svelte';
  import Button from '$components/button/button.svelte';
  import Header from '$components/header/header.svelte';
  import { XIcon } from 'lucide-svelte';
  import FormLabel from '$components/formLabel/formLabel.svelte';

  const { Story } = defineMeta({
    title: 'Drawer',
    component: Drawer,
    tags: ['autodocs'],
    args: {
      open: true,
    },
  });

  let exampleOpen = $state(true);
  const mockClose = fn(() => (exampleOpen = false));
</script>

{#snippet children()}
  <div class="p-4">I am the content</div>
{/snippet}

<Story name="Default" args={{ children }} />

<Story
  name="With custom close"
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await fireEvent.click(canvas.getByRole('button', { name: 'Close me' }));
    await expect(mockClose).toHaveBeenCalledOnce();
    await expect(exampleOpen).toBeFalsy();
  }}
>
  {#snippet children()}
    <Button onclick={() => (exampleOpen = true)}>Open Drawer</Button>
    <Drawer bind:open={exampleOpen} onclose={mockClose}>
      {#snippet children({ close })}
        <div class="p-4">
          <p>I am the custom things</p>
          <button
            onclick={close}
            class="px-2 py-3 underline bg-emerald-600 rounded">Close me</button
          >
        </div>
      {/snippet}
    </Drawer>
  {/snippet}
</Story>

<Story
  name="Kitchen Sink"
  play={async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const reopenDrawer = async () => {
      await fireEvent.click(
        canvas.getByRole('button', { name: 'View Details' }),
      );
    };
    if (!exampleOpen) {
      await reopenDrawer();
    }
    await expect(canvas.getByRole('dialog')).toHaveTextContent(
      'Payment Details',
    );
    await expect(canvas.getByRole('dialog')).toHaveTextContent(
      'Internet (Comcast)',
    );
    await fireEvent.click(canvas.getByTestId('header-close'));
    await expect(exampleOpen).toBeFalsy();
    await reopenDrawer();
    await fireEvent.click(canvas.getByRole('button', { name: 'Close' }));
    await expect(exampleOpen).toBeFalsy();
    await reopenDrawer();
    await userEvent.keyboard('[Escape]');
    await expect(exampleOpen).toBeFalsy();
    await reopenDrawer();
  }}
>
  {#snippet children()}
    <Button onclick={() => (exampleOpen = true)}>View Details</Button>
    <Drawer bind:open={exampleOpen} onclose={mockClose}>
      {#snippet children({ close })}
        <section class="p-4">
          <Header>
            Payment Details
            {#snippet actions()}
              <Button
                variant="custom"
                onclick={close}
                data-testid="header-close"
                ><XIcon size="1.5em" /><span class="sr-only">Close Drawer</span
                ></Button
              >
            {/snippet}
          </Header>
          <p class="italic">
            You can close this by clicking the "Close" button, the "X" button in
            the top right, or by hitting the <kbd>Esc</kbd> key on your keyboard
          </p>
          <div class="grid grid-cols-4 mt-4">
            <FormLabel label="Bill">Internet (Comcast)</FormLabel>
            <FormLabel label="Payment Date">
              {new Date().toLocaleString(undefined)}
            </FormLabel>
            <FormLabel label="Paid By">User 1 (user@email.com)</FormLabel>
            <FormLabel label="Amount Paid">$142.28</FormLabel>
          </div>
          <div class="flex justify-end">
            <Button variant="primary" size="md" onclick={close}>Close</Button>
          </div>
        </section>
      {/snippet}
    </Drawer>
  {/snippet}
</Story>
