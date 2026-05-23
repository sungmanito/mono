<script lang="ts">
  import Drawerify from '$components/drawerify/drawerify.svelte';
  import Breadcrumb from '$lib/components/breadcrumb/breadcrumb.svelte';
  import Header from '$lib/components/header/header.svelte';
  import Progress, {
    type ProgressPins,
  } from '$lib/components/progress/progress.svelte';
  import {
    getPaymentHistoryMonths,
    getCurrentPaymentsByHousehold,
    togglePayment,
  } from '$lib/remotes/payments.remote';
  import { CheckIcon, ClockAlertIcon } from 'lucide-svelte';
  import PaymentDetails from './[id=ulid]/+page.svelte';
  import CreatePaymentPage from './create/[id=ulid]/+page.svelte';
  import { getLastDayOfMonth } from '$utils/date';

  let showMakePaymentModal = $state(false);
  let showModalOpenUrl = $state('');

  let detailsModalOpen = $state(false);
  let detailsModalUrl = $state('');

  const paymentDetailsOpen = () => {
    // Using history.pushState because using pushState from sveltekit makes this whole
    // thing blow tf up
    history.pushState(undefined, '', detailsModalUrl);
  };

  const paymentHistoryMonths = $derived(await getPaymentHistoryMonths());
  let selectedMonth = $derived(
    paymentHistoryMonths.length ? paymentHistoryMonths[0].month : null,
  );

  const paymentsByHousehold = $derived(
    selectedMonth
      ? await getCurrentPaymentsByHousehold(selectedMonth.toISOString())
      : {},
  );

  const paymentPins = $derived(
    Object.values(paymentsByHousehold).flatMap(
      (m) =>
        m.payments.map((p) => ({
          status: p.paidAt !== null ? 'paid' : 'pending',
          name: p.billName,
          date: p.forMonthD,
        })) satisfies ProgressPins[],
    ),
  );
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
  <Header class="mt-4">
    Payments
    {#snippet actions()}
      <select name="currentMonth" class="select" bind:value={selectedMonth}>
        <svelte:boundary>
          {#snippet pending()}
            <option disabled>Loading</option>
          {/snippet}

          {#each await getPaymentHistoryMonths() as month}
            {@const dateObj = new Date(month.month)}
            <option value={month.month}>
              {dateObj.toLocaleDateString(undefined, {
                month: 'long',
                year: 'numeric',
                timeZone: 'UTC',
              })}
            </option>
          {/each}
        </svelte:boundary>
      </select>
    {/snippet}
  </Header>
  <p class="font-xl font-semibold text-zinc-400">
    Showing all payments for {selectedMonth?.toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }) ?? ''}
  </p>

  <p class="text-zinc-400 mt-4">Monthly Progress</p>

  <div class="progress">
    <div class="progress-track"></div>
  </div>

  <Progress
    today={selectedMonth ? new Date(selectedMonth) : new Date()}
    end={selectedMonth
      ? getLastDayOfMonth(selectedMonth)
      : getLastDayOfMonth(new Date())}
    pins={paymentPins}
  />

  <div class="flex flex-col gap-3 mt-4" role="list">
    <svelte:boundary>
      {#snippet pending()}
        {#each Array(5)}
          <div class="card animate-pulse h-16">&nbsp;</div>
        {/each}
      {/snippet}
      {#each Object.values(paymentsByHousehold) as { name, payments }}
        <Header tag="h3" color="secondary" class="mt-6 mb-2">
          {name}
        </Header>
        {#each payments as payment}
          {@const paymentForm = togglePayment.for(payment.id)}
          <form {...paymentForm}>
            <div
              class={[
                'card',
                {
                  'variant-outline-success': payment.paidAt !== null,
                  'variant-outline-error':
                    payment.paidAt === null && payment.forMonthD < new Date(),
                },
              ]}
              role="listitem"
            >
              <header class="card-header">
                <Header tag="h5" color="secondary">
                  <div class="flex gap-3 items-baseline">
                    {#if payment.paidAt !== null}
                      <CheckIcon class="text-success-800" size="1em" />
                    {:else if payment.paidAt === null && payment.forMonthD < new Date()}
                      <ClockAlertIcon class="text-error-500" size="1em" />
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
                  <em>
                    Due by {payment.forMonthD.toLocaleString(undefined, {
                      month: 'long',
                      day: 'numeric',
                    })}
                  </em>
                {/if}
              </section>
            </div>
          </form>
        {:else}
          <em>No Payments available</em>
        {/each}
      {/each}
    </svelte:boundary>
  </div>
</div>
