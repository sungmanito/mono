<script lang="ts">
  import { enhance } from '$app/forms';
  import { pushState, replaceState } from '$app/navigation';
  import Drawerify from '$components/drawerify/drawerify.svelte';
  import Button from '$lib/components/button/button.svelte';
  import Header from '$lib/components/header/header.svelte';
  import { Accordion, AccordionItem } from '@skeletonlabs/skeleton';
  import { HomeIcon, PlusIcon } from 'lucide-svelte';
  import CreateBillComponent from './bills/create/+page.svelte';
  import CreateHousehold from './household/create/+page.svelte';
  import CreatePayment from './payments/create/[id=ulid]/+page.svelte';

  let { data } = $props();

  let showCreateBillModal = $state(false);
  let createPaymentDrawerUrl = $state('/');
  let showCreatePaymentDrawer = $state(createPaymentDrawerUrl !== '/');
  let showCreateHousehold = $state(false);

  $effect(() => {
    showCreatePaymentDrawer = createPaymentDrawerUrl !== '/';
  });

  async function showPaymentDrawer(paymentId: string) {
    createPaymentDrawerUrl = `/dashboard/payments/create/${paymentId}`;
  }

  async function showCreateHouseholdDrawer() {
    showCreateHousehold = true;
  }
</script>

<svelte:head>
  <title>Dashboard &ndash; Home</title>
</svelte:head>

<Drawerify
  bind:open={showCreateBillModal}
  component={CreateBillComponent}
  url="/dashboard/bills/create"
  onopen={() => pushState('/dashboard/bills/create', {})}
  onclose={() => replaceState('/dashboard', {})}
/>

<Drawerify
  bind:open={showCreateHousehold}
  url="/dashboard/household/create"
  onopen={() => pushState('/dashboard/household/create', {})}
  onclose={() => replaceState('/dashboard', {})}
  component={CreateHousehold}
/>

<Drawerify
  bind:open={showCreatePaymentDrawer}
  onclose={() => replaceState('/dashboard', {})}
  onopen={() => pushState(createPaymentDrawerUrl, {})}
  component={CreatePayment}
  url={createPaymentDrawerUrl}
/>

<div class="container mx-auto p-3">
  <Header class="mt-4 mb-4">
    {data.user?.email || ''}
    Dashboard
    {#snippet actions()}
      <Button
        variant="primary:ghost"
        onclick={() => (showCreateBillModal = true)}
        class="flex gap-1"
      >
        <PlusIcon size="1.1em" />
        New Bill
      </Button>
      <button
        class="btn variant-ghost-primary btn-sm flex gap-2"
        type="button"
        onclick={() => showCreateHouseholdDrawer()}
      >
        <HomeIcon size="1.1em" />
        New Household
      </button>
    {/snippet}
  </Header>

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
                  onclick={() =>
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
                      onclick={() =>
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
                  onclick={() =>
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
