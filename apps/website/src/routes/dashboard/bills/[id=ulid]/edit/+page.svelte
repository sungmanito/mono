<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto, invalidate } from '$app/navigation';
  import Button from '$lib/components/button/button.svelte';
  import FormLabel from '$lib/components/formLabel/formLabel.svelte';
  import Header from '$lib/components/header/header.svelte';
  import type { DrawerifyPage } from '$lib/util/page.js';
  import type { SubmitFunction } from '@sveltejs/kit';
  import { XIcon } from 'lucide-svelte';
  import type { PageData } from './$types.js';
  import Currency from '$lib/components/currency/currency.svelte';

  let {
    data,
    component = false,
    onclose = () => void 0,
    submit = () => {
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
    },
  }: DrawerifyPage<PageData> & {
    submit: SubmitFunction;
  } = $props();

  console.info('BILL DATA', data);

  let bill = $derived(data.bill);

  let households = $derived(data.households);

  let saving = $state(false);
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
    {#snippet actions()}
      {#if component}
        <button onclick={() => onclose()}>
          <XIcon size="1em" />
        </button>
      {/if}
    {/snippet}
  </Header>
  <section class="grid grid-cols-5 gap-3">
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
    <div>
      <FormLabel label="Amount">
        <input
          class="input"
          name="amount"
          placeholder="Monthly amount"
          type="number"
          value={bill.amount}
        />
      </FormLabel>
    </div>
    <div>
      <FormLabel label="Currency">
        <Currency selected={bill.currency} name="currency" />
      </FormLabel>
    </div>
    <div class="col-span-3 flex justify-end gap-3">
      {#if component}
        <Button
          type="button"
          variant="filled"
          disabled={saving}
          onclick={() => onclose()}
        >
          Close
        </Button>
      {/if}
      <Button type="submit" disabled={saving}>Save</Button>
    </div>
  </section>
</form>
