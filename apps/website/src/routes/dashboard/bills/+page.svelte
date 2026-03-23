<script lang="ts">
  import { replaceState } from '$app/navigation';
  import { hijackNav } from '$lib/attachments/hijack.svelte';
  import Breadcrumb from '$lib/components/breadcrumb/breadcrumb.svelte';
  import Button from '$lib/components/button/button.svelte';
  import Drawerify from '$lib/components/drawerify/drawerify.svelte';
  import Header from '$lib/components/header/header.svelte';
  import Modal from '$lib/components/modal/modal.svelte';
  import { makeShowDrawerUtil } from '$lib/util/drawer.svelte';
  import { ordinalSuffix } from '$utils/numbers';
  import { PencilIcon, PlusIcon, TrashIcon } from 'lucide-svelte';
  import type { Component } from 'svelte';
  import CreateBillComponent from './create/+page.svelte';
  import ShowBillDetailsComponent from './edit/[ids=ulids]/+page.svelte';
  import { deleteBills, getUserBills } from '$lib/remotes/bills.remote';

  let deleteModalOpen = $state(false);

  let selectedBillIds: string[] = $state([]);

  let createBillStore = makeShowDrawerUtil('/dashboard/bills/create');
  let editBillStore = makeShowDrawerUtil('/dashboard/bills');
  let showBillDetailsStore = makeShowDrawerUtil('/dashboard/bills/:billId');

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
   * @param ids
   */
  async function fetchEditBillData(ids: string[]) {
    if (ids.length === 0) return;
    editBillStore.show = true;
    editBillStore.url = `/dashboard/bills/edit/${ids.join(',')}`;
    history.pushState(null, '', editBillStore.url);
  }
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
    selectedBillIds = [];
    getUserBills().refresh();
  }}
  component={ShowBillDetailsComponent as Component<{
    data: unknown;
    component: boolean;
    onclose: () => void;
  }>}
/>

<svelte:boundary>
  {#snippet pending()}
    <div class="container mx-auto">
      <div class="h-8 w-48 rounded animate-pulse bg-surface-300 mb-6 mt-6"></div>
      <div class="h-10 w-full rounded animate-pulse bg-surface-300 mb-6"></div>
      {#each Array(3) as _}
        <div class="h-8 w-64 rounded animate-pulse bg-surface-300 mt-8 mb-4"></div>
        {#each Array(4) as _}
          <div class="h-20 rounded-lg animate-pulse bg-surface-300 mt-6"></div>
        {/each}
      {/each}
    </div>
  {/snippet}

  {@const bills = await getUserBills()}
  {@const byHousehold = bills.reduce(
    (acc, bill) => {
      if (!acc[bill.householdName]) {
        acc[bill.householdName] = [];
      }
      acc[bill.householdName].push(bill);
      return acc;
    },
    {} as Record<string, (typeof bills)[number][]>,
  )}

  <!-- Delete modal — uses deleteBills remote form -->
  <form
    {...deleteBills.enhance(async ({ submit }) => {
      await submit();
      deleteModalOpen = false;
      selectedBillIds = [];
    })}
  >
    <Modal
      bind:open={deleteModalOpen}
      onclose={() => {
        deleteModalOpen = false;
        selectedBillIds = [];
      }}
    >
      {#snippet header()}
        Delete Bills?
      {/snippet}
      {#snippet footer()}
        <Button type="submit">Delete</Button>
      {/snippet}
      {#each selectedBillIds as id}
        <input type="hidden" name="bill-id[]" value={id} />
      {/each}
      <div class="max-w-72">
        <p>
          Are you sure you want to delete <strong>{selectedBillIds.length}</strong> bills?
        </p>
        <p>
          This action cannot be undone, and will delete all payment history
          associated with this bill.
        </p>
      </div>
    </Modal>
  </form>

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
          disabled={selectedBillIds.length === 0}
          onclick={() => {
            deleteModalOpen = true;
          }}
          aria-label="Delete selected bills"
        >
          <TrashIcon size="1rem" />
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onclick={() => fetchEditBillData(selectedBillIds)}
          disabled={selectedBillIds.length === 0}
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
      {#each Object.entries(byHousehold) as [householdName, householdBills]}
        <Header tag="h3" class="mt-8 mb-4">
          {#snippet actions()}
            {@const isIndeterminate = (() => {
              const selectedSet = new Set(selectedBillIds);
              const theseBillIds = new Set(householdBills.map((b) => b.id));
              const difference = theseBillIds.difference(selectedSet);
              const intersection = selectedSet.intersection(theseBillIds);
              return (
                intersection.size > 0 && selectedSet.size > 0 && difference.size > 0
              );
            })()}
            {@const checked = householdBills.every((bill) =>
              selectedBillIds.includes(bill.id),
            )}
            <input
              type="checkbox"
              class="checkbox"
              onchange={() => {
                const selectedSet = new Set(selectedBillIds);
                const theseBillIds = new Set(householdBills.map((b) => b.id));
                const diff = theseBillIds.difference(selectedSet);
                if (diff.size === 0) {
                  theseBillIds.forEach((id) => selectedSet.delete(id));
                } else {
                  diff.forEach((id) => selectedSet.add(id));
                }
                selectedBillIds = Array.from(selectedSet);
              }}
              indeterminate={isIndeterminate}
              {checked}
            />
          {/snippet}

          {householdName}
        </Header>
        {#each householdBills as bill (bill.id)}
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
                  onclick: (e) => {
                    e.preventDefault();
                    history.pushState(null, '', `/dashboard/bills/${bill.id}`);
                  },
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
                    const set = new Set(selectedBillIds);
                    if (set.has(bill.id)) {
                      set.delete(bill.id);
                    } else {
                      set.add(bill.id);
                    }
                    selectedBillIds = Array.from(set);
                  }}
                  checked={selectedBillIds.includes(bill.id)}
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
                  selectedBillIds = [bill.id];
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
                  fetchEditBillData([bill.id]);
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
</svelte:boundary>
