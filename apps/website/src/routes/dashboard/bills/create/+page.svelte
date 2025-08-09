<script lang="ts">
  import { enhance } from '$app/forms';
  import Button from '$lib/components/button/button.svelte';
  import FormLabel from '$lib/components/formLabel/formLabel.svelte';
  import Header from '$lib/components/header/header.svelte';
  import type { ModalifyPage } from '$lib/util/page';
  import type { SubmitFunction } from '@sveltejs/kit';
  import { type } from 'arktype';
  import { XCircleIcon, XIcon } from 'lucide-svelte';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';
  import Currency from '$components/currency/currency.svelte';
  import { invalidate } from '$app/navigation';

  const tmpBillValidator = type({
    name: 'string',
    dueDate: '1<=number<=28',
    household: 'string',
    'amount?': 'number>0',
    'currency?': 'string>=3',
  });

  let {
    data,
    component = false,
    onclose = () => void 0,
    submit = () => {
      return async ({ formElement }) => {
        onclose();
        formElement.reset();
        await invalidate('user:bills');
      };
    },
  }: ModalifyPage<PageData> & { submit: SubmitFunction } = $props();

  let households = $derived(data.households);

  let hasDrag = $state(false);

  type BillTmp = (typeof tmpBillValidator)['infer'];

  let bills: BillTmp[] = $state([
    {
      name: '',
      dueDate: 1,
      household: '',
      amount: 0,
      currency: 'USD',
    },
  ]);

  onMount(() => {
    if (data.initialBills.length > 0) bills = data.initialBills;
  });
</script>

<form
  action="/dashboard/bills?/addBill"
  method="post"
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

            return {
              name,
              dueDate: dueDateN,
              household: '',
            };
          });
          bills = bills.concat(b);
        }
      }
    }
  }}
  use:enhance={submit}
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
  <section
    class="grid grid-cols-[repeat(5,1fr)_minmax(20px,min-content)] gap-3"
  >
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
          <Currency selected={bill.currency} />
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
