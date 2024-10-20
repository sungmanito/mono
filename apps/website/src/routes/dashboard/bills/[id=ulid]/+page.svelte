<script lang="ts">
  import { preloadData, pushState } from '$app/navigation';
  import Drawer from '$lib/components/drawer/drawer.svelte';
  import type { PageData as PaymentPageData } from '../../payments/[id=ulid]/$types';
  import PaymentDetails from '../../payments/[id=ulid]/+page.svelte';


  let paymentDetailData: PaymentPageData | null = $state(null);
  interface Props { data: any, component?: boolean, onclose?: () => void }

  let { data, component = false, onclose = () => {} }: Props = $props();

  async function showPaymentDetails(paymentId: string) {
    const paymentData = await preloadData(`/dashboard/payments/${paymentId}`);
    if (paymentData.type === 'loaded' && paymentData.status === 200) {
      paymentDetailData = paymentData.data as PaymentPageData;
    }
  }
</script>

<svelte:head>
  <title>
    Dashboard &ndash; {data.bill.billName}
  </title>
</svelte:head>

{#if paymentDetailData !== null}
  <Drawer
    open={paymentDetailData !== null}
    on:close={() => {
      paymentDetailData = null;
      pushState(`/dashboard/bills/${data.bill.id}`, {});
    }}
    let:close={closeDrawer}
  >
    <div class="px-4">
      <PaymentDetails
        data={paymentDetailData}
        component
        onclose={closeDrawer}
      />
    </div>
  </Drawer>
{/if}

<div class="p-6 flex-grow">
  <h1 class="h1 mb-8 flex items-baseline gap-6">
    {data.bill.billName}
    <small>
      (<a href="/">{data.bill.household.name}</a>)
    </small>
  </h1>

  {#await data.payments}
    <div class="placeholder animate-pulse w-3/5 h-56"></div>
    <div class="placeholder animate-pulse mt-4"></div>
    <div class="placeholder animate-pulse mt-4"></div>
    <div class="placeholder animate-pulse mt-4"></div>
    <div class="placeholder animate-pulse mt-4"></div>
  {:then payments}
    <section class="flex flex-col gap-5">
      {#each payments as payment}
        <section class="rounded card variant-ghost-primary">
          <header class="card-header flex gap-4 pb-3">
            <a
              href={`/dashboard/payments/${payment.id}`}
              onclick={(e) => {
                e.preventDefault();
                // @ts-expect-error can't turn this shit off rn
                // eslint-disable-next-line
                pushState(e.target.href, {});
                showPaymentDetails(payment.id);
              }}
            >
              {payment.forMonthD.toLocaleDateString(undefined, {
                month: 'long',
                year: 'numeric',
              })}
            </a>
            <div
              class="badge"
              class:variant-filled={payment.paidAt === null}
              class:variant-filled-success={payment.paidAt !== null}
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
  {/await}
</div>
