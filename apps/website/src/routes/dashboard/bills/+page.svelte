<script lang="ts">
  import Breadcrumb from '$lib/components/breadcrumb/breadcrumb.svelte';
  import Button from '$lib/components/button/button.svelte';
  import Drawerify from '$lib/components/drawerify/drawerify.svelte';
  import Header from '$lib/components/header/header.svelte';
  import { makeShowDrawerUtil } from '$lib/util/drawer.svelte';
  import { PencilIcon, PlusIcon, TrashIcon } from 'lucide-svelte';
  import EditBillComponent from './[id=ulid]/edit/+page.svelte';
  import CreateBillComponent from './create/+page.svelte';
  import Modal from '$lib/components/modal/modal.svelte';
  import type { Component } from 'svelte';

  let { data } = $props();

  let deleteModalOpen = $state(false);

  let selectedBill: (typeof data.bills)[number] | null = $state(null);
  let validation = $state('');

  let createBillStore = makeShowDrawerUtil('/dashboard/bills/create');
  let editBillStore = makeShowDrawerUtil('/dashboard/bills');

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
   * @param bill
   */
  async function fetchEditBillData(bill: (typeof data.bills)[number]) {
    if (bill.id === undefined) return;
    editBillStore.show = true;
    editBillStore.url = `/dashboard/bills/${bill.id}/edit`;
    history.pushState(null, '', editBillStore.url);
  }

  $effect(() => {
    if (editBillStore.show) {
      history.pushState(null, '', editBillStore.url);
    }
  });
</script>

<svelte:head>
  <title>Sungmanito &ndash; Bills</title>
</svelte:head>

<Drawerify
  bind:open={createBillStore.show}
  onclose={() => {
    createBillStore.url = '/dashboard/bills/create';
    history.back();
  }}
  url={createBillStore.url}
  component={CreateBillComponent as Component<{
    data: unknown;
    component: boolean;
    onclose: () => void;
  }>}
/>

<Drawerify
  bind:open={editBillStore.show}
  onclose={() => {
    history.back();
  }}
  url={editBillStore.url}
  component={EditBillComponent as Component<{
    data: unknown;
    component: boolean;
    onclose: () => void;
  }>}
/>

<Modal
  open={deleteModalOpen}
  onclose={() => {
    deleteModalOpen = false;
    validation = '';
    selectedBill = null;
  }}
  action="?/deleteBill"
  submitFn={async () => {
    // You can add custom logic here if needed after successful submit
  }}
>
  {#snippet header()}
    Delete "{selectedBill?.billName}"?
  {/snippet}
  {#snippet children({ close })}
    <input type="hidden" name="bill-id" value={selectedBill?.id} />
    <section>
      <p>Are you sure you want to delete {selectedBill?.billName}?</p>
      <p>Please type in &quot;delete&quot;</p>
      <input type="text" class="input px-3 py-1 mt-3" bind:value={validation} />
    </section>
    <footer class="border-t pt-3 flex justify-end gap-2">
      <button type="button" onclick={close} class="btn variant-outline btn-sm">
        Close
      </button>
      <button
        class="btn btn-sm variant-filled-primary"
        disabled={validation !== 'delete'}
      >
        Submit
      </button>
    </footer>
  {/snippet}
</Modal>

<div class="@container mx-auto px-3 flex-grow">
  <div class="@3xl:max-w-[75vw] mx-auto">
    <Breadcrumb
      class="my-4"
      crumbs={[
        {
          link: 'Dashboard',
          href: '/dashboard',
        },
        {
          link: 'Bills',
          href: '/dashboard/bills',
        },
      ]}
    />

    <Header class="mb-6">
      Bills
      {#snippet actions()}
        <Button
          class="flex gap-2 items-center"
          onclick={() => fetchCreateBillData()}
        >
          <PlusIcon size="0.9em" />
          Add
        </Button>
      {/snippet}
    </Header>

    <!-- TODO: Fancy todo table -->
    <table class="table table-compact table-hover">
      <thead>
        <tr>
          <th> Bill name </th>
          <th> Due date </th>
          <th> Household </th>
          <th> Actions </th>
        </tr>
      </thead>
      <tbody>
        {#each data.bills as bill}
          <tr>
            <td>
              <a
                href={`/dashboard/bills/${bill.id}`}
                class="link link-primary underline"
              >
                {bill.billName}
              </a>
              &ndash; <small>({bill.id})</small>
            </td>
            <td>
              {bill.dueDate}
            </td>
            <td>
              {bill.householdName}
            </td>
            <td>
              <div class="flex gap-2">
                <button
                  class="btn-icon btn-icon-sm variant-filled-secondary"
                  title={`Edit Bill ${bill.billName}`}
                  onclick={() => {
                    fetchEditBillData(bill);
                  }}
                >
                  <PencilIcon size="1em" />
                </button>

                <button
                  class="btn-icon btn-icon-sm variant-filled-secondary"
                  title={`Delete bill ${bill.billName}`}
                  onclick={() => {
                    selectedBill = bill;
                    deleteModalOpen = true;
                  }}
                >
                  <TrashIcon size="1em" />
                </button>
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
