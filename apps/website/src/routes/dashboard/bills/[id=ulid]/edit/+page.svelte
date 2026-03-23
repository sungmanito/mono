<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import Button from '$lib/components/button/button.svelte';
  import FormLabel from '$lib/components/formLabel/formLabel.svelte';
  import Header from '$lib/components/header/header.svelte';
  import { XIcon } from 'lucide-svelte';
  import Currency from '$lib/components/currency/currency.svelte';
  import { getBill, getUserBills, updateBill } from '$lib/remotes/bills.remote';
  import { getUserHouseholds } from '$lib/remotes/common.remote';

  let {
    component = false,
    onclose = () => void 0,
  }: { component?: boolean; onclose?: () => void } = $props();

  let saving = $state(false);
</script>

<svelte:boundary>
  {#snippet pending()}
    <div class="p-4">
      <div class="h-8 w-48 rounded animate-pulse bg-surface-300 mb-4"></div>
      <div class="grid grid-cols-5 gap-3">
        {#each Array(5) as _}
          <div class="h-16 rounded animate-pulse bg-surface-300"></div>
        {/each}
      </div>
    </div>
  {/snippet}

  {@const bill = await getBill(page.params.id)}
  {@const households = await getUserHouseholds()}

  <form
    {...updateBill.enhance(async ({ submit }) => {
      saving = true;
      try {
        await submit();
        if (component) {
          onclose();
        } else {
          goto('/dashboard/bills');
        }
      } finally {
        saving = false;
      }
    })}
    class="p-4"
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
          <select class="select" name="household-id" required placeholder="Holding">
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
</svelte:boundary>
