<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import { enhance } from '$app/forms';
  import Breadcrumb from '$lib/components/breadcrumb/breadcrumb.svelte';
  import Button from '$lib/components/button/button.svelte';
  import Drawer from '$lib/components/drawer/drawer.svelte';
  import Header from '$lib/components/header/header.svelte';
  import { getToastStore } from '@skeletonlabs/skeleton';
  import type { ActionResult } from '@sveltejs/kit';
  import { PencilIcon, PlusIcon, TrashIcon, XIcon } from 'lucide-svelte';

  export let data;

  let editModal: HTMLDialogElement;
  let deleteModal: HTMLDialogElement;

  let selectedBill: (typeof data.bills)[number] = data.bills[0];
  let validation = '';

  const toastStore = getToastStore();
  let showAdd = false;
  let addBillCount = 1;

  async function submitForm(
    e: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement }
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

<Drawer on:close={() => (showAdd = false)} open={showAdd} let:close={closeAdd}>
  <form action="?/addBill" method="post" use:enhance={() => {
    return async ({ result, formElement }) => {
      console.info(result);
      showAdd = false;
      formElement.reset();
      addBillCount = 1;
    }
  }}>
    <div class="p-4">
      <Header tag="h2" color="secondary" class="mb-4">
        Add bill
        <svelte:fragment slot="actions">
          <button type="button" class="btn-icon btn-icon-lg" on:click={() => closeAdd()}>
            <XIcon size="1em" />
          </button>
        </svelte:fragment>
      </Header>
      <section>
        <div class="grid grid-cols-4 gap-3">
          {#each Array.from({ length: addBillCount }) as bill, i}
          <div>
            <label class="label flex-col gap-2">
              <span class="font-semibold">Bill Name</span>
              <input type="text" class="input" name="bill-name[]" placeholder="Rent, Credit Card, Cell Phones, etc.">
            </label>
          </div>
          <div>
            <label class="label flex-col gap-2">
              <span class="font-semibold">Due date</span>
              <input type="number" min="1" max="28" class="input" name="due-date[]" placeholder="1">
            </label>
          </div>
          <div>
            <label class="label flex-col gap-2">
              <span class="font-semibold">Household</span>
              <select class="select" name="household-id[]">
                <option disabled>Choose a household</option>
                {#each data.households as household}
                <option value={household.households.id}>{household.households.name}</option>
                {/each}
              </select>
            </label>
          </div>
          <div class="flex items-end">
            {#if i === addBillCount - 1}
              <button class="btn-icon btn-icon-sm variant-outline-tertiary" on:click={() => addBillCount = addBillCount + 1}>
                <PlusIcon size="1.5em"/>
              </button>
            {/if}
          </div>
          {/each}
        </div>
        <div class="flex justify-end mt-4 gap-4">
          <Button type="button" on:click={() => closeAdd()} variant="filled">
            Close
          </Button>
          <Button>
            Submit
          </Button>
        </div>
        
      </section>
    </div>
  </form>
</Drawer>

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
    <input type="hidden" name="bill-id" value={selectedBill.billId} />
    <header class="h4 border-b pb-2">
      Delete &quot;{selectedBill.billName}&quot;?
    </header>
    <section>
      <p>Are you sure you want to delete {selectedBill.billName}?</p>
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

<dialog
  bind:this={editModal}
  class="p-4 rounded bg-surface-active-token shadow shadow-gray-400 text-token backdrop:bg-surface-600"
>
  <form method="dialog" action="?/updateBill" on:submit={submitForm}>
    <input type="hidden" name="bill-id" value={selectedBill.billId} />
    <div class="min-w-max flex flex-col gap-2">
      <header class="h4 flex justify-between items-center text-token">
        <div>
          Edit {selectedBill.billName}
        </div>
        <div>
          <button
            type="button"
            class="btn-icon btn-icon-sm"
            on:click={() => editModal.close()}
          >
            <XIcon size="1em" />
          </button>
        </div>
      </header>
      <section>
        <label>
          <span>Bill Name</span>
          <input
            class="input variant-filled px-3 py-2"
            name="bill-name"
            type="text"
            value={selectedBill.billName}
          />
        </label>
        <label>
          <span>Due Date</span>
          <input
            class="input variant-filled px-3 py-2"
            name="due-date"
            type="number"
            value={selectedBill.billDueDate}
          />
        </label>
        <label>
          <span> Household </span>
          <select name="household-id" class="input variant-filled px-3 py-2">
            {#each data.households as { households }}
              <option
                value={households.id}
                selected={households.id === selectedBill.householdId}
              >
                {households.name}
              </option>
            {/each}
          </select>
        </label>
      </section>
      <footer class="flex justify-end gap-3">
        <button
          type="button"
          on:click={() => editModal.close()}
          class="btn btn-sm variant-outline"
        >
          Close
        </button>
        <button type="submit" class="btn btn-sm variant-filled-primary">
          Submit
        </button>
      </footer>
    </div>
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
      <Button class="flex gap-2 items-center" on:click={() => (showAdd = true)}>
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
            {bill.billName}
          </td>
          <td>
            {bill.billDueDate}
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
                  selectedBill = bill;
                  editModal.showModal();
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
