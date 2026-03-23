<script lang="ts">
  import Button from '$lib/components/button/button.svelte';
  import FormLabel from '$lib/components/formLabel/formLabel.svelte';
  import Header from '$lib/components/header/header.svelte';
  import Currency from '$components/currency/currency.svelte';
  import { XCircleIcon, XIcon } from 'lucide-svelte';
  import { createBill, getUserBills } from '$lib/remotes/bills.remote';
  import { getUserHouseholds } from '$lib/remotes/common.remote';
  import { page } from '$app/state';
  import { type } from 'arktype';

  const tmpBillValidator = type({
    name: 'string',
    dueDate: '1<=number<=28',
    household: 'string',
    'amount?': 'number>0',
    'currency?': 'string>=3',
  });

  let {
    component = false,
    onclose = () => void 0,
  }: { component?: boolean; onclose?: () => void } = $props();

  type BillTmp = (typeof tmpBillValidator)['infer'];

  // Parse initial bills from URL search params (e.g. ?household-id[]=abc)
  const initialBillsFromUrl: BillTmp[] = (() => {
    const ids = page.url.searchParams.getAll('household-id[]');
    if (ids.length > 0) {
      return ids.map((id) => ({ name: '', dueDate: 1, household: id }));
    }
    return [];
  })();

  let bills: BillTmp[] = $state(
    initialBillsFromUrl.length > 0
      ? initialBillsFromUrl
      : [{ name: '', dueDate: 1, household: '', amount: 0, currency: 'USD' }],
  );

  let hasDrag = $state(false);
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

  {@const households = await getUserHouseholds()}

  <form
    {...createBill.enhance(async ({ submit }) => {
      await submit();
      getUserBills().refresh();
      onclose();
    })}
    class={['p-4', hasDrag && 'border border-dashed']}
    ondrop={async (e) => {
      e.preventDefault();
      if (e.dataTransfer && e.dataTransfer.items) {
        for (let i of Array.from(e.dataTransfer.items)) {
          const f = i.getAsFile();
          if (f && f.type === 'text/csv') {
            const content = await f.text();
            const values = content
              .split(/\r?\n/g)
              .map((r) => r.split(','))
              .filter((c) => c.every((cc) => cc !== ''));

            const b = values.map((r) => {
              let [name, dueDate] = r;
              let dueDateN = Number(dueDate);
              if (isNaN(dueDateN)) dueDateN = 1;
              return { name, dueDate: dueDateN, household: '' } satisfies BillTmp;
            });
            bills = bills.concat(b);
          }
        }
      }
    }}
  >
    <Header color="secondary" tag="h2">
      Create new bill
      {#snippet actions()}
        {#if component}
          <button type="button" onclick={() => onclose()}>
            <XIcon size="1em" />
          </button>
        {/if}
      {/snippet}
    </Header>
    <section class="grid grid-cols-[repeat(5,1fr)_minmax(20px,min-content)] gap-3">
      {#each bills as bill, i}
        <div class="col-start-1">
          <FormLabel label="Name">
            <input
              class="input"
              name="name[]"
              placeholder="Name of the bill"
              required
              value={bill.name}
            />
          </FormLabel>
        </div>
        <div>
          <FormLabel label="Household">
            <select
              class="select"
              name="household-id[]"
              required
              placeholder="Please select a household"
            >
              <option value="-1" disabled>Please select a household</option>
              {#each households as household (household.id)}
                <option
                  value={household.id}
                  selected={household.id === bill.household}
                  >{household.name}</option
                >
              {/each}
            </select>
          </FormLabel>
        </div>
        <div>
          <FormLabel label="Due date">
            <input
              class="input"
              name="due-date[]"
              type="number"
              min="1"
              max="28"
              required
              placeholder="Due date between 1 and 28"
              value={bill.dueDate}
            />
          </FormLabel>
        </div>
        <div>
          <FormLabel label="Amount">
            <input
              class="input"
              name="amount[]"
              placeholder="Monthly amount"
              type="number"
              value={bill.amount}
            />
          </FormLabel>
        </div>
        <div>
          <FormLabel label="Currency">
            <Currency selected={bill.currency} name="currency[]" />
          </FormLabel>
        </div>
        <div class="flex flex-col justify-end items-center">
          <div class="flex gap-2">
            {#if i === bills.length - 1}
              <Button
                type="button"
                onclick={() => {
                  bills = bills.concat({
                    name: '',
                    household: '',
                    dueDate: 1,
                    amount: 0,
                    currency: bills[bills.length - 1].currency,
                  });
                }}
              >
                New Bill
              </Button>
            {/if}
            {#if bills.length > 1}
              <button
                type="button"
                class="btn-icon"
                onclick={() => {
                  bills = bills.filter((_, idx) => idx !== i);
                }}
              >
                <XCircleIcon size="1em" />
              </button>
            {/if}
          </div>
        </div>
      {/each}
      <div class="col-span-4 flex justify-end gap-3">
        {#if component}
          <Button variant="filled" type="button" onclick={() => onclose()}>
            Close
          </Button>
        {/if}
        <Button type="submit">Add</Button>
      </div>
    </section>
  </form>
</svelte:boundary>
