<script lang="ts">
  import { invalidateAll, preloadData, pushState } from '$app/navigation';
  import Breadcrumb from '$lib/components/breadcrumb/breadcrumb.svelte';
  import Button from '$lib/components/button/button.svelte';
  import Header from '$lib/components/header/header.svelte';
  import { getToastStore } from '@skeletonlabs/skeleton';
  import type { ActionResult } from '@sveltejs/kit';
  import { PencilIcon, PlusIcon, TrashIcon } from 'lucide-svelte';
  import type { PageData as CreateBillData } from './create/$types';
  import type { PageData as EditBillData } from './[id=ulid]/edit/$types';
  import CreateBillComponent from './create/+page.svelte';
  import EditBillComponent from './[id=ulid]/edit/+page.svelte';
  import Drawer from '$lib/components/drawer/drawer.svelte';

  export let data;

  let editModal: HTMLDialogElement;
  let deleteModal: HTMLDialogElement;

  let selectedBill: (typeof data.bills)[number] | null = null;
  let validation = '';

  const toastStore = getToastStore();

  let createBillData: CreateBillData | null = null;
  let editBillData: EditBillData | null = null;

  /**
   * @description Fetches and loads the data for creating new bills for the given householdIds
   * @param householdIds
   */
  async function fetchCreateBillData(householdIds?: string[]) {
    const params = householdIds?.map((h) => `household-id[]=${h}`).join('&');

    const data = await preloadData(
      `/dashboard/bills/create${params ? '?' + params : ''}`,
    );

    if (data.type === 'loaded' && data.status === 200) {
      createBillData = data.data as CreateBillData;
      pushState('/dashboard/bills/create', {});
    }
  }

  /**
   * @description Updates the edit bill data to show the editing drawer
   * @param bill
   */
  async function fetchEditBillData(bill: (typeof data.bills)[number]) {
    const h = data.households.find(
      (hh) => hh.households.id === bill.householdId,
    );

    if (h !== undefined) {
      editBillData = {
        ...data,
        bill: {
          ...bill,
          household: h.households,
        },
        households: data.households.map((h) => h.households),
      };
      pushState(`/dashboard/bills/${bill.id}/edit`, {});
    }
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

{#if createBillData !== null}
  <Drawer
    open={createBillData !== null}
    on:close={() => (createBillData = null)}
    let:close={closeDrawer}
  >
    <CreateBillComponent
      data={createBillData}
      component
      onclose={closeDrawer}
    />
  </Drawer>
{/if}

{#if editBillData !== null}
  <Drawer
    open={editBillData !== null}
    let:close={closeDrawer}
    on:close={() => {
      editBillData = null;
      pushState('/dashboard/bills', {});
    }}
  >
    <EditBillComponent data={editBillData} component onclose={closeDrawer} />
  </Drawer>
{/if}

<dialog
  bind:this={deleteModal}
  class="p-4 rounded bg-surface-active-token shadow backdrop:bg-gray-800/30"
>
  <form
    class="flex flex-col gap-2"
    method="dialog"
    action="?/deleteBill"
    on:submit={submitForm}
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
        on:click={() => deleteModal.close()}
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
        <tr on:click={() => console.info(bill)}>
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
                on:click={() => {
                  fetchEditBillData(bill);
                }}
              >
                <PencilIcon size="1em" />
              </button>

              <button
                class="btn-icon btn-icon-sm variant-filled-secondary"
                title={`Delete bill ${bill.billName}`}
                on:click={() => {
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
