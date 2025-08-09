<script lang="ts">
  import { enhance } from '$app/forms';
  import Drawerify from '$components/drawerify/drawerify.svelte';
  import Breadcrumb from '$lib/components/breadcrumb/breadcrumb.svelte';
  import Header from '$lib/components/header/header.svelte';
  import { CheckIcon } from 'lucide-svelte';
  import PaymentDetails from './[id=ulid]/+page.svelte';
  import CreatePaymentPage from './create/[id=ulid]/+page.svelte';

  let { data } = $props();

  async function showModal(paymentId: string) {
    showMakePaymentModal = true;
    showModalOpenUrl = `/dashboard/payments/create/${paymentId}`;
    makePaymentOpen();
  }

  let showMakePaymentModal = $state(false);
  let showModalOpenUrl = $state('');

  let detailsModalOpen = $state(false);
  let detailsModalUrl = $state('');

  function makePaymentOpen() {
    history.pushState(undefined, '', showModalOpenUrl);
  }

  const paymentDetailsOpen = () => {
    // Using history.pushState because using pushState from sveltekit makes this whole
    // thing blow tf up
    history.pushState(undefined, '', detailsModalUrl);
  };
</script>

<svelte:head>
  <title>Dashboard &ndash; Payments</title>
</svelte:head>
<Drawerify
  onclose={() => history.back()}
  bind:open={showMakePaymentModal}
  url={showModalOpenUrl}
  component={CreatePaymentPage}
/>

<Drawerify
  onclose={() => history.back()}
  bind:open={detailsModalOpen}
  component={PaymentDetails}
  url={detailsModalUrl}
/>

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

  <div class="flex flex-col gap-3 mt-4" role="list">
    {#each data.payments as payment}
      <div
        role="listitem"
        class="card"
        class:variant-outline-success={payment.paidAt !== null}
      >
        <header class="card-header">
          <Header tag="h5" color="secondary">
            <div class="flex gap-3 items-baseline">
              {#if payment.paidAt !== null}
                <CheckIcon size="1em" />
              {/if}
              <div>
                <a
                  href={`/dashboard/payments/${payment.id}`}
                  onclick={(e) => {
                    e.preventDefault();
                    detailsModalUrl = `/dashboard/payments/${payment.id}`;
                    detailsModalOpen = true;
                    paymentDetailsOpen();
                  }}
                >
                  {payment.billName}
                </a>
              </div>
            </div>
            {#snippet actions()}
              {#if payment.paidAt === null}
                <button
                  class="btn btn-sm variant-outline-primary"
                  type="button"
                  onclick={() => {
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
            {/snippet}
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
