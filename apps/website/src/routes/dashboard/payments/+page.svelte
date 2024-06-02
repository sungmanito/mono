<script lang="ts">
  import Header from '$lib/components/header/header.svelte';
  import { CheckIcon } from 'lucide-svelte';
  import { enhance } from '$app/forms';
  import Breadcrumb from '$lib/components/breadcrumb/breadcrumb.svelte';
  import type { PageData as CreatePageData } from './create/[id=ulid]/$types';
  import type { PageData as PaymentDetailsData } from './[id=ulid]/$types';
  import CreatePaymentPage from './create/[id=ulid]/+page.svelte';
  import { preloadData, pushState, replaceState } from '$app/navigation';
  import Drawer from '$lib/components/drawer/drawer.svelte';
  import PaymentDetails from './[id=ulid]/+page.svelte';

  export let data;

  let createPaymentData: CreatePageData | null = null;

  let showPaymentData: PaymentDetailsData | null = null;

  async function showModal(paymentId: string) {
    const data = await preloadData(`/dashboard/payments/create/${paymentId}`);
    if (data.type === 'loaded' && data.status === 200) {
      pushState(`/dashboard/payments/create/${paymentId}`, {});
      createPaymentData = data.data as CreatePageData;
    }
  }

  async function showDetailsModal(paymentId: string) {
    const response = await preloadData(`/dashboard/payments/${paymentId}`);

    if (response.type === 'loaded' && response.status === 200) {
      showPaymentData = response.data as PaymentDetailsData;
      pushState(`/dashboard/payments/${paymentId}`, {});
    }
  }
</script>

<svelte:head>
  <title>Dashboard &ndash; Payments</title>
</svelte:head>

{#if createPaymentData !== null}
  <Drawer
    open={createPaymentData !== null}
    on:close={() => {
      createPaymentData = null;
      replaceState('/dashboard/payments', {});
    }}
    let:close={closeDrawer}
  >
    <CreatePaymentPage
      data={createPaymentData}
      component={true}
      onclose={closeDrawer}
    />
  </Drawer>
{/if}

{#if showPaymentData !== null}
  <Drawer
    open={showPaymentData !== null}
    on:close={() => {
      showPaymentData = null;
      pushState('/dashboard/payments', {});
    }}
    let:close={onclose}
  >
    <PaymentDetails data={showPaymentData} component {onclose} />
  </Drawer>
{/if}

<div class="container mx-auto px-3">
  <Breadcrumb
    class="mt-4"
    crumbs={[
      {
        link: 'Dashboard',
        href: '/dashboard',
      },
      {
        link: 'Payments',
        href: '/dashboard/payments',
      },
    ]}
  />
  <Header class="mt-4">Payments</Header>
  <p class="font-xl font-semibold text-zinc-300">
    Includes payments from this month.
  </p>

  <div class="flex flex-col gap-3 mt-4">
    {#each data.payments as payment}
      <div class="card" class:variant-outline-success={payment.paidAt !== null}>
        <header class="card-header">
          <Header tag="h5" color="secondary">
            <div class="flex gap-3 items-baseline">
              {#if payment.paidAt !== null}
                <CheckIcon size="1em" />
              {/if}
              <div>
                <a
                  href="/"
                  on:click={(e) => {
                    e.preventDefault();
                    showDetailsModal(payment.id);
                  }}
                >
                  {payment.billName}
                </a>
              </div>
            </div>
            <svelte:fragment slot="actions">
              {#if payment.paidAt === null}
                <button
                  class="btn btn-sm variant-outline-primary"
                  type="button"
                  on:click={() => {
                    showModal(payment.id);
                  }}
                >
                  Mark as paid
                </button>
              {:else}
                <form action="?/unpayBill" method="post" use:enhance>
                  <input name="paymentId" type="hidden" value={payment.id} />
                  <button class="btn btn-sm variant-outline-secondary">
                    Unmark as paid
                  </button>
                </form>
              {/if}
            </svelte:fragment>
          </Header>
        </header>

        <section class="p-3">
          {#if payment.paidAt !== null}
            <strong>
              Paid {payment.paidAt.toLocaleString(undefined, {
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                hour12: true,
                minute: '2-digit',
              })}
            </strong>
          {:else}
            <em>Waiting for payment...</em>
          {/if}
        </section>
      </div>
    {:else}
      <em>No Payments available</em>
    {/each}
  </div>
</div>
