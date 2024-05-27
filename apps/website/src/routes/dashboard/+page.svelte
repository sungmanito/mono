<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidate, preloadData } from '$app/navigation';
  import CreateBill from '$lib/components/bills/create.svelte';
  import Button from '$lib/components/button/button.svelte';
  import Drawer from '$lib/components/drawer/drawer.svelte';
  import Header from '$lib/components/header/header.svelte';
  import {
    Accordion,
    AccordionItem,
    Step,
    Stepper,
  } from '@skeletonlabs/skeleton';
  import { HomeIcon, PlusIcon, XIcon } from 'lucide-svelte';
  import type { PageData as CreatePaymentData } from './payments/create/[id=ulid]/$types';
  import type { PageData as CreateHouseholdData } from './household/create/$types';
  import CreatePayment from './payments/create/[id=ulid]/+page.svelte';
  import CreateHousehold from './household/create/+page.svelte';
  export let data;

  let billName = '';
  let dueDate = 1;
  let householdId = '';

  let modalEl: HTMLDialogElement;

  let showCreateBillModal = false;
  let createPaymentData: CreatePaymentData | null = null;

  let createHouseholdData: CreateHouseholdData | null = null;

  async function showPaymentDrawer(paymentId: string) {
    const data = await preloadData(`/dashboard/payments/create/${paymentId}`);
    if (data.type === 'loaded' && data.status === 200) {
      createPaymentData = data.data as CreatePaymentData;
    }
  }

  async function showCreateHouseholdDrawer() {
    const data = await preloadData('/dashboard/household/create');

    if (data.type === 'loaded' && data.status === 200) {
      createHouseholdData = data.data as CreateHouseholdData;
    }
  }
</script>

<svelte:head>
  <title>Dashboard</title>
</svelte:head>

<CreateBill
  open={showCreateBillModal}
  on:close={() => (showCreateBillModal = false)}
  households={data.households}
  submit={() => {
    return async ({ update, formElement }) => {
      formElement.reset();
      await update();
      showCreateBillModal = false;
      await invalidate('household:bills');
    };
  }}
/>

{#if createHouseholdData !== null}
  <Drawer
    open={showCreateBillModal !== null}
    on:close={() => (createHouseholdData = null)}
    let:close={closeDrawer}
  >
    <CreateHousehold onclose={closeDrawer} component={true} />
  </Drawer>
{/if}

{#if createPaymentData !== null}
  <Drawer
    open={createPaymentData !== null}
    on:close={() => (createPaymentData = null)}
    let:close={closeDrawer}
  >
    <CreatePayment
      data={createPaymentData}
      component={true}
      onclose={closeDrawer}
    />
  </Drawer>
{/if}

<div class="container mx-auto p-3">
  <Header class="mt-4 mb-4">
    {data.user?.email || ''}
    Dashboard
    <svelte:fragment slot="actions">
      <Button
        variant="primary:ghost"
        on:click={() => (showCreateBillModal = true)}
        class="flex gap-1"
      >
        <PlusIcon size="1.1em" />
        New Bill
      </Button>
      <button
        class="btn variant-ghost-primary btn-sm flex gap-2"
        type="button"
        on:click={() => showCreateHouseholdDrawer()}
      >
        <HomeIcon size="1.1em" />
        New Household
      </button>
    </svelte:fragment>
  </Header>

  <dialog
    bind:this={modalEl}
    class="bg-surface-800 w-10/12 text-white p-4 rounded backdrop:bg-zinc-900/40"
    id="add-bill-ui"
  >
    <header class="flex justify-end">
      <button
        class="btn btn-icon"
        on:click={() => {
          modalEl.close();
        }}
      >
        <XIcon size="1.1em" />
      </button>
    </header>
    <form action="?/addBill" method="post">
      <Stepper
        on:complete={() => {
          const fd = new FormData();
          fd.append('household-id', householdId);
          fd.append('bill-name', billName);
          fd.append('due-date', dueDate.toString());
          fetch('?/addBill', {
            method: 'post',
            body: fd,
          })
            .then(console.info)
            .catch(console.error);
          // Reset
          [householdId, billName, dueDate] = ['', '', 1];

          modalEl.close();
        }}
      >
        <Step>
          <svelte:fragment slot="header">Bill Information</svelte:fragment>
          <input
            class="px-2 input"
            type="text"
            name="bill-name"
            placeholder="Name of the bill"
            required
            bind:value={billName}
          />
          <input
            bind:value={dueDate}
            name="dueDate"
            class="px-2 input"
            placeholder="1"
            type="number"
            min="1"
            max="31"
            required
          />
        </Step>
        <Step>
          <svelte:fragment slot="header">Household</svelte:fragment>
          <select
            bind:value={householdId}
            name="household-id"
            class="input p-3"
          >
            {#each data.households as household}
              <option value={household.id}>
                {household.name} &ndash; {household.householdCount} member(s)
              </option>
            {:else}
              <option disabled> No households </option>
            {/each}
          </select>
        </Step>
      </Stepper>
    </form>
  </dialog>

  <div class="">
    <Accordion class="grid grid-cols-4 gap-2">
      <AccordionItem open class="card variant-soft-surface col-span-2">
        <svelte:fragment slot="summary">
          <Header tag="h3" color="secondary">Past Due</Header>
        </svelte:fragment>
        <svelte:fragment slot="content">
          <section class="p-4">
            {#each data.groupings.past as { bills, payments }}
              {bills.billName}
              <div class="flex gap-3 items-center">
                <button
                  class="btn btn-sm variant-filled"
                  type="button"
                  on:click={() =>
                    payments !== null ? showPaymentDrawer(payments.id) : void 0}
                >
                  Pay bill
                </button>
              </div>
            {/each}
          </section>
        </svelte:fragment>
      </AccordionItem>
      <AccordionItem open class="card variant-soft-surface col-span-2">
        <svelte:fragment slot="summary">
          <Header tag="h3" color="secondary">Upcoming</Header>
        </svelte:fragment>
        <svelte:fragment slot="content">
          <form action="/dashboard/payments?/payBill" method="post" use:enhance>
            <div class="flex flex-col gap-4">
              {#each data.groupings.upcoming as { bills, household, payments }}
                <div class="card variant-outline-primary">
                  <Header tag="h4" class="card-header">
                    {bills.billName} due on {bills.dueDate}
                  </Header>
                  <section class="p-4">
                    {household.name}
                  </section>
                  <footer class="card-footer">
                    <button
                      class="btn btn-sm variant-filled"
                      name="pay-bill-id"
                      on:click={() =>
                        payments !== null
                          ? showPaymentDrawer(payments.id)
                          : void 0}
                      type="button">Pay bill</button
                    >
                  </footer>
                </div>
              {:else}
                No Upcoming bills
              {/each}
            </div>
          </form>
        </svelte:fragment>
      </AccordionItem>
      <AccordionItem
        open={data.groupings.comingSoon.length > 0}
        class="card variant-soft-surface col-span-2"
      >
        <svelte:fragment slot="summary">
          <Header tag="h3" color="secondary">Coming Soon</Header>
        </svelte:fragment>
        <svelte:fragment slot="content">
          <div class="flex flex-col gap-2">
            {#each data.groupings.comingSoon as { bills, payments }}
              <div class="flex gap-3 items-center">
                {bills.billName}
                <button
                  class="btn btn-sm variant-filled"
                  type="button"
                  on:click={() =>
                    payments !== null ? showPaymentDrawer(payments.id) : void 0}
                >
                  Pay bill
                </button>
              </div>
            {:else}
              <p>No bills coming soon</p>
            {/each}
          </div>
        </svelte:fragment>
      </AccordionItem>
      <AccordionItem
        open={data.groupings.paid.length > 0}
        class="card variant-soft-surface col-span-2"
      >
        <svelte:fragment slot="summary">
          <Header tag="h3" color="secondary">Paid</Header>
        </svelte:fragment>
        <svelte:fragment slot="content">
          <div class="grid grid-cols-3 gap-32">
            {#each data.groupings.paid as { bills, payments }}
              <div class="card variant-filled-primary">
                <header class="card-header p-4">
                  <a href={`/dashboard/payments/${payments?.id}`}>
                    {bills.billName} - due on {bills.dueDate}
                  </a>
                </header>
                <section class="p-3">
                  Paid <strong
                    >{payments?.paidAt?.toLocaleString(undefined, {
                      timeZoneName: 'shortOffset',
                    })}</strong
                  >
                </section>
              </div>
            {:else}
              <div class="">No paid bills</div>
            {/each}
          </div>
        </svelte:fragment>
      </AccordionItem>
      <AccordionItem open={data.groupings.rest.length > 0} class="col-span-4">
        <svelte:fragment slot="summary">
          <Header tag="h3" color="secondary">Other bills</Header>
        </svelte:fragment>
        <svelte:fragment slot="content">
          <table class="table table-interactive">
            <thead>
              <tr>
                <th>Bill Name</th>
                <th>Due Date</th>
                <th>Household</th>
              </tr>
            </thead>
            <tbody>
              {#each data.groupings.rest as { bills, household }}
                <tr>
                  <td>
                    {bills.billName}
                  </td>
                  <td>
                    {bills.dueDate}
                  </td>
                  <td>
                    {household.name}
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </svelte:fragment>
      </AccordionItem>
    </Accordion>
  </div>
</div>
