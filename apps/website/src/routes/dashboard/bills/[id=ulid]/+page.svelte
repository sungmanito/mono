<script lang="ts">
  import { pushState } from '$app/navigation';
  import { page } from '$app/state';
  import Alert from '$components/alert/alert.svelte';
  import Header from '$components/header/header.svelte';
  import Button from '$lib/components/button/button.svelte';
  import Drawerify from '$lib/components/drawerify/drawerify.svelte';
  import Expandable from '$lib/components/expandable/expandable.svelte';
  import { XIcon } from 'lucide-svelte';
  import PaymentDetails from '../../payments/[id=ulid]/+page.svelte';
  import Breadcrumb from '$components/breadcrumb/breadcrumb.svelte';
  import Chart from '$components/chart/chart.svelte';
  import { makeShowDrawerUtil } from '$utils/drawer.svelte';
  import { formatNumber, ordinalSuffix } from '$lib/util/numbers';
  import { getBillWithPayments } from '$lib/remotes/bills.remote';

  let {
    component = false,
    onclose = () => void 0,
  }: { component?: boolean; onclose?: () => void } = $props();

  let paymentDetails = makeShowDrawerUtil();

  function showPaymentDetails(paymentId: string) {
    paymentDetails.url = `/dashboard/payments/${paymentId}`;
    paymentDetails.show = true;
  }
</script>

<svelte:head>
  <title>Dashboard &ndash; Bills</title>
</svelte:head>

<Drawerify
  component={PaymentDetails}
  url={paymentDetails.url}
  open={paymentDetails.show}
  onclose={() => (paymentDetails.url = '')}
/>

<svelte:boundary>
  {#snippet pending()}
    <div class="p-6 flex-grow @container">
      <div class="wrapper @3xl:max-w-[75vw] mx-auto">
        <div class="h-8 w-64 rounded animate-pulse bg-surface-300 mb-6"></div>
        <div class="h-32 rounded animate-pulse bg-surface-300 mb-8"></div>
        <div class="h-48 rounded animate-pulse bg-surface-300 mb-4"></div>
        {#each Array(5) as _}
          <div class="h-16 rounded animate-pulse bg-surface-300 mt-4"></div>
        {/each}
      </div>
    </div>
  {/snippet}

  {@const billData = await getBillWithPayments(page.params.id)}

  <div class="p-6 flex-grow @container">
    <div class="wrapper @3xl:max-w-[75vw] mx-auto">
      {#if !component}
        <Breadcrumb
          class="mb-4"
          crumbs={[
            { link: 'Dashboard', href: '/dashboard' },
            { link: 'Household', href: '/dashboard/household' },
            {
              link: billData.household.name,
              href: `/dashboard/household/${billData.household.id}`,
            },
            {
              link: billData.billName,
              href: `/dashboard/bills/${billData.id}`,
            },
          ]}
        />
      {/if}
      <Header tag="h1" color="secondary" class="mb-6">
        {billData.billName}
        {#snippet actions()}
          {#if component}
            <Button onclick={() => onclose()} variant="custom">
              <XIcon size="1.5em" />
            </Button>
          {/if}
        {/snippet}
      </Header>

      <Alert class="mb-4" type="info:ghost">
        <Header tag="h5" color="secondary">Details</Header>
        <div class="grid grid-cols-2 md:grid-cols-4 about-list gap-x-4 rounded">
          <div>Household</div>
          <div>
            <a
              class="link"
              href={`/dashboard/household/${billData.householdId}`}
              >{billData.household.name}</a
            >
          </div>
          <div>Due Date</div>
          <div>{billData.dueDate}{ordinalSuffix(billData.dueDate)}</div>
          <div>Notes</div>
          <div>
            {#if billData.notes}
              {billData.notes}
            {:else}
              <em>N/A</em>
            {/if}
          </div>
          <div>Amount</div>
          <div>{formatNumber(billData.amount)}</div>
          <div>Currency</div>
          <div>{billData.currency}</div>
        </div>
      </Alert>

      <Expandable class="bg-surface-backdrop-token p-4 rounded mb-8" open>
        {#snippet header()}
          <Header tag="h3">Payment History</Header>
        {/snippet}
        {@const labels = billData.payments
          .slice()
          .sort((a, b) => a.forMonthD.getTime() - b.forMonthD.getTime())
          .map((p) =>
            p.forMonthD.toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              timeZone: 'Etc/UTC',
            }),
          )}

        <Chart
          {labels}
          type="line"
          datasets={[
            {
              data: billData.payments
                .slice()
                .sort((a, b) => a.forMonthD.getTime() - b.forMonthD.getTime())
                .map((p) => Number(p.amount) ?? null),
              label: `${billData.billName} (Actual)`,
              type: 'line',
            },
            {
              data: Array.from(
                { length: billData.payments.length },
                () => billData.amount || 0,
              ),
              label: 'Minimum',
              type: 'line',
              borderDash: [5, 10],
            },
          ]}
          options={{
            scales: {
              y: { grid: { color: '#e9e9e950' } },
              x: { grid: { color: '#eee' } },
            },
          }}
        />
      </Expandable>

      <section class="flex flex-col gap-5">
        {#each billData.payments as payment (payment.id)}
          <section class="rounded card variant-ghost-primary">
            <header class="card-header flex gap-4 pb-3">
              <a
                href={`/dashboard/payments/${payment.id}`}
                onclick={(e) => {
                  e.preventDefault();
                  pushState(`/dashboard/payments/${payment.id}`, {});
                  showPaymentDetails(payment.id);
                }}
              >
                {payment.forMonthD.toLocaleDateString(undefined, {
                  month: 'long',
                  year: 'numeric',
                  timeZone: 'Etc/UTC',
                })}
              </a>
              <div
                class={[
                  'badge',
                  {
                    'variant-filled': payment.paidAt === null,
                    'variant-filled-success': payment.paidAt !== null,
                  },
                ]}
              >
                {#if payment.paidAt === null}
                  Unpaid
                {:else}
                  Paid ({payment.paidAt.toLocaleString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })})
                {/if}
              </div>
            </header>
          </section>
        {:else}
          No payment history yet
        {/each}
      </section>
    </div>
  </div>
</svelte:boundary>

<style>
  .about-list {
    margin-bottom: theme('spacing.4');

    & > div:nth-child(odd) {
      font-weight: bold;
      text-transform: capitalize;
    }
  }
</style>
