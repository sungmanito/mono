<script lang="ts">
  import { invali = $state()dateAll, pushState } from '$app/navigation';
  import Breadcrumb from '$lib/components/breadcrumb/breadcrumb.svelte';
  import Button from '$lib/components/button/button.svelte';
  import Drawerify from '$lib/components/drawerify/drawerify.svelte';
  import Header from '$lib/components/header/header.svelte';
  import { getToastStore } from '@skeletonlabs/skeleton';
  import type { ActionResult } from '@sveltejs/kit';
  import { PencilIcon, PlusIcon, TrashIcon } from 'lucide-svelte';
  import EditBillComponent from './[id=ulid]/edit/+page.svelte';
  import CreateBillComponent from './create/+page.svelte';

  interface Props { data: any }

  let { data }: Props = $props();

  let editModal: HTMLDialogElement;
  let deleteModal: HTMLDialogElement;

  let selectedBill: (typeof data.bills)[number] | null = $state(null);
  let validation = $state('');

  const toastStore = getToastStore();

  let createBillUrl = $state('/dashboard/bills/create');
  let showCreatebill = $state(false);
  let editBillUrl = $state('/dasahboard/bills');
  let showEditBill = $state(false);

  /**
   * @description Fetches and loads the data for creating new bills for the given householdIds
   * @param householdIds
   */
  async function fetchCreateBillData(householdIds?: string[]) {
    showCreatebill = true;
    const params =
      householdIds?.map((h) => `household-id[]=${h}`).join('&') || '';

    createBillUrl = `/dashboard/bills/create${params ? '?' + params : ''}`;
  }

  /**
   * @description Updates the edit bill data to show the editing drawer
   * @param bill
   */
  async function fetchEditBillData(bill: (typeof data.bills)[number]) {
    if (bill.id === undefined) return;
    showEditBill = true;
    editBillUrl = `/dashboard/bills/${bill.id}/edit`;
  }

  async function submitForm(
    e: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement },
  ) {
    // Cancel this
    e.preventDefault();
    // Grab the action for the current form
    const action = e.currentTarget.action;

    // Create the form data
    const data = new FormData(e.currentTarget);

    // Get the response of the action
    const response = (await fetch(action, {
      method: 'post',
      body: data,
    }).then((r) => r.json())) as ActionResult;

    if (
      response.type === 'success' &&
      response.status >= 200 &&
      response.status <= 299
    ) {
      await invalidateAll();
      (e.target as HTMLFormElement).closest('dialog')?.close();
      validation = '';
      editModal.close();
    } else if (response.type === 'error') {
      toastStore.trigger({
        message: response.error.message,
        timeout: 3000,
      });
    }

    validation = '';
  }
</script>

<svelte:head>
  <title>Sungmanito &ndash; Bills</title>
</svelte:head>

<Drawerify
  bind:open={showCreatebill}
  on:close={() => {
    createBillUrl = '/dashboard/bills/create';
  }}
  on:open={() => {
    pushState('/dashboard/bills/create', {});
  }}
  url={createBillUrl}
  component={CreateBillComponent}
/>

<Drawerify
  bind:open={showEditBill}
  on:close={() => {
    pushState('/dashboard/bills', {});
  }}
  on:open={() => {
    pushState(editBillUrl, {});
  }}
  url={editBillUrl}
  component={EditBillComponent}
/>

<dialog
  bind:this={deleteModal}
  class="p-4 rounded bg-surface-active-token shadow backdrop:bg-gray-800/30"
>
  <form
    class="flex flex-col gap-2"
    method="dialog"
    action="?/deleteBill"
    onsubmit={submitForm}
  >
    <input type="hidden" name="bill-id" value={selectedBill?.id} />
    <header class="h4 border-b pb-2">
      Delete &quot;{selectedBill?.billName}&quot;?
    </header>
    <section>
      <p>Are you sure you want to delete {selectedBill?.billName}?</p>
      <p>Please type in &quot;delete&quot;</p>
      <input type="text" class="input px-3 py-1 mt-3" bind:value={validation} />
    </section>
    <footer class="border-t pt-3 flex justify-end gap-2">
      <button
        type="button"
        onclick={() => deleteModal.close()}
        class="btn variant-outline btn-sm"
      >
        Close
      </button>
      <button
        class="btn btn-sm variant-filled-primary"
        disabled={validation !== 'delete'}
      >
        Submit
      </button>
    </footer>
  </form>
</dialog>

<div class="container mx-auto px-3">
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
    <svelte:fragment slot="actions">
      <Button
        class="flex gap-2 items-center"
        on:click={() => fetchCreateBillData()}
      >
        <PlusIcon size="0.9em" />
        Add
      </Button>
    </svelte:fragment>
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
            {bill.billName} &ndash; <small>({bill.id})</small>
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
                  console.info('BILL', bill);
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
                  deleteModal.showModal();
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
