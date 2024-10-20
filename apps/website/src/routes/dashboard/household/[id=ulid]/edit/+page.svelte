<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto, invalidate } from '$app/navigation';
  import Button from '$lib/components/button/button.svelte';
  import FormLabel from '$lib/components/formLabel/formLabel.svelte';
  import { page } from '$app/stores';
  import { Loader2 } from 'lucide-svelte';


  interface Props { data: any, component?: boolean, onclose?: () => void }

  let { data, component = false, onclose = () => void 0 }: Props = $props();

  let sending = $state(false);

  let household = $derived(data.household);
</script>

<svelte:head>
  <title>
    Household &ndash; Edit {household.name}
  </title>
</svelte:head>

<form
  action="/dashboard/household?/updateHousehold"
  class="flex flex-col gap-4 p-4"
  method="post"
  use:enhance={() => {
    sending = true;
    return async ({ update }) => {
      sending = false;
      await update();
      await invalidate('user:households');
      if (!component) {
        goto(`/dashboard/household/${$page.params.id}`);
      } else {
        onclose();
      }
    };
  }}
>
  <input type="hidden" name="household-id" value={household.id} />

  <h2 class="h2 flex gap-2">
    {#if sending}
      <Loader2 size={'1.5em'} spin />
    {/if}
    Edit {household.name}
  </h2>
  <p class="text-surface-700-200-token">ID: {household.id}</p>

  <FormLabel label="Household Name">
    <input
      name="name"
      disabled={sending}
      type="text"
      class="input"
      value={household.name}
    />
  </FormLabel>

  <section class="flex gap-3">
    {#if component}
      <Button disabled={sending} variant="filled" on:click={() => onclose()}
        >Close</Button
      >
    {/if}
    <Button disabled={sending}>Save</Button>
  </section>
</form>
