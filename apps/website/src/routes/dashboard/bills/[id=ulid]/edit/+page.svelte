<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto, invalidate } from '$app/navigation';
  import Button from '$lib/components/button/button.svelte';
  import FormLabel from '$lib/components/formLabel/formLabel.svelte';
  import Header from '$lib/components/header/header.svelte';
  import type { SubmitFunction } from '@sveltejs/kit';
  import { XIcon } from 'lucide-svelte';

  export let data;
  export let component = false;
  export let onclose: () => void = () => void 0;

  $: bill = data.bill;

  $: households = data.households;

  export let submit: SubmitFunction = () => {
    saving = true;
    return async ({ update, formElement }) => {
      formElement.reset();
      await update();
      await invalidate('user:bills');
      if (component) {
        onclose();
      } else {
        goto('/dashboard/bills');
      }
    };
  };
  let saving = false;
</script>

<form
  action="/dashboard/bills?/updateBill"
  method="post"
  class="p-4"
  use:enhance={submit}
>
  <input type="hidden" name="bill-id" value={bill.id} />
  <Header color="secondary" tag="h2">
    Update {bill.billName}
    <svelte:fragment slot="actions">
      {#if component}
        <button on:click={() => onclose}>
          <XIcon size="1em" />
        </button>
      {/if}
    </svelte:fragment>
  </Header>
  <section class="grid grid-cols-3 gap-3">
    <div>
      <FormLabel label="Bill name">
        <input
          type="text"
          class="input"
          name="bill-name"
          value={bill.billName}
        />
      </FormLabel>
    </div>
    <div>
      <FormLabel label="Household">
        <select
          class="select"
          name="household-id"
          required
          placeholder="Holding"
        >
          {#each households as household (household.id)}
            <option
              value={household.id}
              selected={household.id === bill.householdId}
              >{household.name}</option
            >
          {/each}
        </select>
      </FormLabel>
    </div>
    <div>
      <FormLabel label="Due Date">
        <input
          type="number"
          name="due-date"
          class="input"
          required
          min="1"
          max="28"
          value={bill?.dueDate}
        />
      </FormLabel>
    </div>
    <div class="col-span-3 flex justify-end gap-3">
      {#if component}
        <Button
          type="button"
          variant="filled"
          disabled={saving}
          on:click={() => onclose()}
        >
          Close
        </Button>
      {/if}
      <Button type="submit" disabled={saving}>Save</Button>
    </div>
  </section>
</form>
