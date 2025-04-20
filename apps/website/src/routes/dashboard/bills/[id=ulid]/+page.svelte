<script lang="ts">
  import { pushState } from '$app/navigation';
  import Alert from '$components/alert/alert.svelte';
  import Header from '$components/header/header.svelte';
  import Button from '$lib/components/button/button.svelte';
  import Drawerify from '$lib/components/drawerify/drawerify.svelte';
  import type { ModalifyPage } from '$lib/util/page';
  import { XIcon } from 'lucide-svelte';
  import PaymentDetails from '../../payments/[id=ulid]/+page.svelte';
  import type { PageData } from './$types';
  import Breadcrumb from '$components/breadcrumb/breadcrumb.svelte';

  let {
    data,
    component = false,
    onclose = () => void 0,
  }: ModalifyPage<PageData> = $props();

  let paymentDetailsUrl = $state('');

  async function showPaymentDetails(paymentId: string) {
    paymentDetailsUrl = `/dashboard/payments/${paymentId}`;
  }
</script>

<svelte:head>
  <title>
    Dashboard &ndash; {data.bill.billName}
  </title>
</svelte:head>

<Drawerify
  component={PaymentDetails}
  url={paymentDetailsUrl}
  open={paymentDetailsUrl !== ''}
  onclose={() => (paymentDetailsUrl = '')}
/>

<div class="p-6 flex-grow">
  {#if !component}
    <Breadcrumb
      class="mb-4"
      crumbs={[
        {
          link: 'Dashboard',
          href: '/dashboard',
        },
        {
          link: 'Household',
          href: '/dashboard/household',
        },
        {
          link: data.bill.household.name,
          href: `/dashboard/household/${data.bill.household.id}`,
        },
        {
          link: data.bill.billName,
          href: `/dashboard/bills/${data.bill.id}`,
        },
      ]}
    />
  {/if}
  <Header tag="h1" color="secondary" class="mb-6">
    {data.bill.billName}
    {#snippet actions()}
      {#if component}
        <Button onclick={() => onclose()} variant="custom">
          <XIcon size="1.5em" />
        </Button>
      {/if}
    {/snippet}
  </Header>

  <Alert class="mb-4" type="info:ghost">
    <Header tag="h5" color="secondary">Info</Header>
    <div class="inline-grid grid-cols-2 about-list gap-x-4 rounded">
      <div>Household</div>
      <div>{data.bill.household.name}</div>
      <div>Due Date</div>
      <div>{data.bill.dueDate}</div>
      <div>Notes</div>
      <div>
        {#if data.bill.notes}
          {data.bill.notes}
        {:else}
          <em>N/A</em>
        {/if}
      </div>
      <div>Amount</div>
      <div>
        {data.bill.amount}
      </div>
      <div>Currency</div>
      <div>
        {data.bill.currency}
      </div>
    </div>
  </Alert>

  {#await data.payments}
    <div class="placeholder animate-pulse w-3/5 h-56"></div>
    <div class="placeholder animate-pulse mt-4"></div>
    <div class="placeholder animate-pulse mt-4"></div>
    <div class="placeholder animate-pulse mt-4"></div>
    <div class="placeholder animate-pulse mt-4"></div>
  {:then payments}
    <section class="flex flex-col gap-5">
      {#each payments as payment (payment.id)}
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

<style>
  .about-list {
    margin-bottom: theme('spacing.4');
    dt {
      font-weight: bold;
      float: left;
      clear: left;
      margin-right: 1rem;
    }

    & > div:nth-child(odd) {
      font-weight: bold;
      text-transform: capitalize;
    }
  }
</style>
