<script lang="ts" module>
  import Header from '$components/header/header.svelte';
  type Props = { component?: boolean; onclose?: () => void };
</script>

<script lang="ts">
  import Button from '$components/button/button.svelte';
  import { XIcon } from 'lucide-svelte';
  import FormLabel from '$components/formLabel/formLabel.svelte';
  import { page } from '$app/state';
  import { getBillsByIds, updateBills, getUserBills } from '$lib/remotes/bills.remote';
  import { getUserHouseholds } from '$lib/remotes/common.remote';

  let { component = false, onclose = () => void 0 }: Props = $props();
</script>

<svelte:boundary>
  {#snippet pending()}
    <div class="@container/main p-6 flex-grow">
      <div class="h-8 w-48 rounded animate-pulse bg-surface-300 mb-4"></div>
      {#each Array(3) as _}
        <div class="p-4 my-2 rounded variant-ghost-surface">
          <div class="h-6 w-40 rounded animate-pulse bg-surface-300 mb-2"></div>
          {#each Array(4) as _}
            <div class="h-12 rounded animate-pulse bg-surface-300 mb-2"></div>
          {/each}
        </div>
      {/each}
    </div>
  {/snippet}

  {@const ids = page.params.ids.split(',')}
  {@const bills = await getBillsByIds(ids)}
  {@const households = await getUserHouseholds()}

  <div class="@container/main p-6 flex-grow">
    <form
      {...updateBills.enhance(async ({ submit }) => {
        await submit();
        getUserBills().refresh();
        onclose();
      })}
    >
      <Header tag="h2">
        Edit Bills
        {#snippet actions()}
          {#if component}
            <Button onclick={onclose} variant="custom" class="btn-icon">
              <XIcon size="1.25em" />
            </Button>
          {/if}
        {/snippet}
      </Header>

      {#each bills as bill (bill.id)}
        <div class="p-4 my-2 rounded variant-ghost-surface">
          <Header color="custom" tag="h4" class="mb-2">
            {bill.billName}
          </Header>
          <input type="hidden" name="bills[].id" value={bill.id} />
          <FormLabel label="Bill name">
            <input
              class="input"
              type="text"
              name="bills[].name"
              value={bill.billName}
            />
          </FormLabel>

          <FormLabel label="Household">
            <select name="bills[].householdId" class="select">
              {#each households as h (h.id)}
                <option value={h.id} selected={bill.householdId === h.id}>{h.name}</option>
              {/each}
            </select>
          </FormLabel>

          <FormLabel label="Due date">
            <input
              class="input"
              type="number"
              name="bills[].dueDate"
              value={bill.dueDate}
              min="1"
              max="28"
              step="1"
              inputmode="numeric"
              required
            />
          </FormLabel>
          <FormLabel label="Amount">
            <input
              class="input"
              type="number"
              name="bills[].amount"
              value={bill.amount || 0}
            />
          </FormLabel>
        </div>
      {/each}
      <footer>
        <Button type="submit" class="mt-4">Save</Button>
      </footer>
    </form>
  </div>
</svelte:boundary>
