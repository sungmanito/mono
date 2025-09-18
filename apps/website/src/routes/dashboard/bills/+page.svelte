<script lang="ts">
  import { invalidateAll, replaceState } from '$app/navigation';
  import { hijackNav } from '$lib/attachments/hijack.svelte';
  import Breadcrumb from '$lib/components/breadcrumb/breadcrumb.svelte';
  import Button from '$lib/components/button/button.svelte';
  import Drawerify from '$lib/components/drawerify/drawerify.svelte';
  import Header from '$lib/components/header/header.svelte';
  import Modal from '$lib/components/modal/modal.svelte';
  import { makeShowDrawerUtil } from '$lib/util/drawer.svelte';
  import { ordinalSuffix } from '$utils/numbers';
  import { useQueryClient } from '@tanstack/svelte-query';
  import { PencilIcon, PlusIcon, TrashIcon } from 'lucide-svelte';
  import type { Component } from 'svelte';
  import CreateBillComponent from './create/+page.svelte';
  import ShowBillDetailsComponent from './edit/[ids=ulids]/+page.svelte';

  let { data } = $props();

  let deleteModalOpen = $state(false);

  let selectedBills: typeof data.bills = $state.raw([]);

  let createBillStore = makeShowDrawerUtil('/dashboard/bills/create');
  let editBillStore = makeShowDrawerUtil('/dashboard/bills');
  let showBillDetailsStore = makeShowDrawerUtil('/dashboard/bills/:billId');

  const queryClient = useQueryClient();

  /**
   * @description Fetches and loads the data for creating new bills for the given householdIds
   * @param householdIds
   */
  async function fetchCreateBillData(householdIds?: string[]) {
    createBillStore.show = true;
    const params =
      householdIds?.map((h) => `household-id[]=${h}`).join('&') || '';

    createBillStore.url = `/dashboard/bills/create${params ? '?' + params : ''}`;
    history.pushState(null, '', createBillStore.url);
  }

  /**
   * @description Updates the edit bill data to show the editing drawer
   * @param bills
   */
  async function fetchEditBillData(bills: typeof data.bills) {
    if (bills.length === 0) return;
    editBillStore.show = true;
    editBillStore.url = `/dashboard/bills/edit/${bills.map((b) => b.id).join(',')}`;
    history.pushState(null, '', editBillStore.url);
  }

  let byHousehold = $derived(
    data.bills.reduce(
      (acc, bill) => {
        if (!acc[bill.householdName]) {
          acc[bill.householdName] = [];
        }
        acc[bill.householdName].push(bill);
        return acc;
      },
      {} as Record<string, (typeof data.bills)[number][]>,
    ),
  );
</script>

<svelte:head>
  <title>Sungmanito &ndash; Bills</title>
</svelte:head>

<Drawerify
  bind:open={createBillStore.show}
  url={createBillStore.url}
  onclose={() => {
    createBillStore.show = false;
    replaceState('/dashboard/bills', {});
  }}
  component={CreateBillComponent as Component<{
    data: unknown;
    component: boolean;
    onclose: () => void;
  }>}
/>

<Drawerify
  bind:open={editBillStore.show}
  url={editBillStore.url}
  onclose={async () => {
    editBillStore.show = false;
    replaceState('/dashboard/bills', {});
    selectedBills = [];
    await queryClient.invalidateQueries({
      queryKey: ['drawerify', editBillStore.url],
    });
    await invalidateAll();
  }}
  component={ShowBillDetailsComponent as Component<{
    data: unknown;
    component: boolean;
    onclose: () => void;
  }>}
/>

<!-- We're using thisch instead of Modalify as I need to figure out a way to have the 
 buttons on the page show up in the correct slots when used in component mode. -->
<Modal
  bind:open={deleteModalOpen}
  onclose={() => {
    deleteModalOpen = false;
    selectedBills = [];
  }}
  action="?/deleteBill"
>
  {#snippet header()}
    Delete Bills?
  {/snippet}
  {#snippet footer()}
    <Button type="submit">Delete</Button>
  {/snippet}
  {#each selectedBills as bill (bill.id)}
    <input type="hidden" name="bill-id[]" value={bill.id} />
  {/each}
  <div class="max-w-72">
    <p>
      Are you sure you want to delete <strong>{selectedBills.length}</strong> bills?
    </p>
    <p>
      This action cannot be undone, and will delete all payment history
      associated with this bill.
    </p>
  </div>
</Modal>

<Drawerify
  bind:open={showBillDetailsStore.show}
  url={showBillDetailsStore.url}
  onclose={() => {
    showBillDetailsStore.show = false;
    history.replaceState(null, '', '/dashboard/bills');
  }}
  component={ShowBillDetailsComponent as Component<{
    data: unknown;
    component: boolean;
    onclose: () => void;
  }>}
/>

<div class="container mx-auto">
  <Breadcrumb
    class="mt-6 mb-4"
    crumbs={[
      { href: '/dashboard', link: 'Dashboard' },
      { href: '/dashboard/bills', link: 'Bills' },
    ]}
  />
  <Header tagClasses="mb-6">
    Bills
    {#snippet actions()}
      <Button
        variant="destructive"
        disabled={selectedBills.length === 0}
        onclick={() => {
          // Open the delete modal and set the selected bills to be deleted
          deleteModalOpen = true;
        }}
        aria-label="Delete selected bills"
      >
        <TrashIcon size="1rem" />
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onclick={() => fetchEditBillData(selectedBills)}
        disabled={selectedBills.length === 0}
        aria-label="Edit selected bills"
      >
        <PencilIcon size="1rem" />
      </Button>
      <Button variant="primary" size="sm" onclick={() => fetchCreateBillData()}>
        <PlusIcon size="1rem" class="mr-2" />
        New Bill
      </Button>
    {/snippet}
  </Header>
  <div>
    {#each Object.entries(byHousehold) as [householdName, bills]}
      <Header tag="h3" class="mt-8 mb-4">
        {#snippet actions()}
          {@const isIndeterminate = (() => {
            const selectedBillsSet = new Set(selectedBills);
            const theseBills = new Set(bills);
            const difference = theseBills.difference(selectedBillsSet);
            const intersection = selectedBillsSet.intersection(theseBills);
            return (
              intersection.size > 0 &&
              selectedBillsSet.size > 0 &&
              difference.size > 0
            );
          })()}
          {@const checked = bills.every((bill) => selectedBills.includes(bill))}
          <input
            type="checkbox"
            class="checkbox"
            onchange={() => {
              const selectedBillsSet = new Set(selectedBills);
              const theseBills = new Set(bills);
              const diff = theseBills.difference(selectedBillsSet);
              if (diff.size === 0) {
                // All bills are selected, so we need to deselect them
                bills.forEach((bill) => selectedBillsSet.delete(bill));
              } else {
                // Some or none of the bills are selected, so we need to select them
                diff.forEach((bill) => selectedBillsSet.add(bill));
              }
              selectedBills = Array.from(selectedBillsSet);
            }}
            indeterminate={isIndeterminate}
            {checked}
          />
        {/snippet}

        {householdName}
      </Header>
      {#each bills as bill (bill.id)}
        <div
          class="p-5 ml-8 mt-6 rounded-lg variant-filled-surface outline-orange-400"
          role="listitem"
          aria-label={bill.billName}
        >
          <Header tag="h4" color="secondary">
            <a
              href={`/dashboard/bills/${bill.id}`}
              {@attach hijackNav({
                store: showBillDetailsStore,
                onclick: (e) => e.preventDefault(),
              })}
            >
              {bill.billName}
            </a>

            {#snippet actions()}
              <input
                class="checkbox"
                type="checkbox"
                value={bill.id}
                onchange={() => {
                  const set = new Set(selectedBills);
                  if (set.has(bill)) {
                    set.delete(bill);
                  } else {
                    set.add(bill);
                  }
                  selectedBills = Array.from(set);
                }}
                checked={selectedBills.includes(bill)}
                aria-label={`Select ${bill.billName}`}
              />
            {/snippet}
          </Header>
          <p class="text-sm text-secondary-foreground">
            {bill.householdName} &ndash; {bill.dueDate}{ordinalSuffix(
              bill.dueDate,
            )}
          </p>
          <footer class="mt-4">
            <Button
              variant="destructive:ghost"
              size="sm"
              onclick={() => {
                selectedBills = [bill];
                deleteModalOpen = true;
              }}
              aria-label="Delete"
            >
              <TrashIcon size="1rem" />
            </Button>
            <Button
              variant="custom"
              class="variant-ghost-tertiary"
              size="sm"
              aria-label="Edit"
              type="button"
              onclick={() => {
                selectedBills = [bill];
                fetchEditBillData(selectedBills);
              }}
            >
              <PencilIcon size="1rem" />
            </Button>
          </footer>
        </div>
      {/each}
    {/each}
  </div>
</div>
