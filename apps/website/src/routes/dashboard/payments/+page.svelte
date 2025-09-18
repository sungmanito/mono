<script lang="ts">
  import Drawerify from '$components/drawerify/drawerify.svelte';
  import Breadcrumb from '$lib/components/breadcrumb/breadcrumb.svelte';
  import Header from '$lib/components/header/header.svelte';
  import {
    getCurrentPayments,
    togglePayment,
  } from '$lib/remotes/payments.remote';
  import { CheckIcon } from 'lucide-svelte';
  import PaymentDetails from './[id=ulid]/+page.svelte';
  import CreatePaymentPage from './create/[id=ulid]/+page.svelte';

  let showMakePaymentModal = $state(false);
  let showModalOpenUrl = $state('');

  let detailsModalOpen = $state(false);
  let detailsModalUrl = $state('');

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
    <svelte:boundary>
      {#snippet pending()}
        {#each Array(5)}
          <div class="card animate-pulse h-16">&nbsp;</div>
        {/each}
      {/snippet}
      {#each await getCurrentPayments() as payment}
        {@const paymentForm = togglePayment.for(payment.id)}
        <form {...paymentForm}>
          <div class="card" role="listitem">
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
                  <button
                    class={[
                      'btn btn-sm ',
                      {
                        'variant-outline-primary': payment.paidAt !== null,
                        'variant-outline-secondary': payment.paidAt === null,
                      },
                    ]}
                    type="submit"
                    name="paymentId"
                    value={payment.id}
                    disabled={paymentForm.pending > 0}
                  >
                    {#if payment.paidAt === null}
                      Mark as paid
                    {:else}
                      Unmark as paid
                    {/if}
                  </button>
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
        </form>
      {:else}
        <em>No Payments available</em>
      {/each}
    </svelte:boundary>
  </div>
</div>
