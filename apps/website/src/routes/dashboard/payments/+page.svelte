<script lang="ts">
  import Header from '$lib/components/header/header.svelte';
  import { CheckIcon } from 'lucide-svelte';
  import { enhance } from '$app/forms';
  import Breadcrumb from '$lib/components/breadcrumb/breadcrumb.svelte';
  import type { PageData } from './$types';
  import CreatePayment from '$lib/components/payments/create.svelte';

  export let data;

  let paymentUpdater: PageData['payments'][number] | null = null;
</script>

<svelte:head>
  <title>Dashboard &ndash; Payments</title>
</svelte:head>

{#if paymentUpdater !== null}
  <CreatePayment
    open={paymentUpdater !== null}
    payment={paymentUpdater}
    on:close={() => (paymentUpdater = null)}
  />
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
      <div
        class="card"
        class:variant-outline-success={payment.payments.paidAt !== null}
      >
        <header class="card-header">
          <Header tag="h5" color="secondary">
            <div class="flex gap-3">
              {#if payment.payments.paidAt !== null}
                <CheckIcon size="1em" />
              {/if}
              <div>
                {#if payment.payments.paidAt !== null}
                  <a
                    href={`/dashboard/payments/${payment.payments.id}`}
                  >
                    {payment.bills.billName}
                  </a>
                {:else}
                  {payment.bills.billName}
                {/if}
              </div>
            </div>
            <svelte:fragment slot="actions">
              {#if payment.payments.paidAt === null}
                <button
                  class="btn btn-sm variant-outline-primary"
                  type="button"
                  on:click={() => {
                    paymentUpdater = payment;
                  }}
                >
                  Mark as paid
                </button>
              {:else}
                <form action="?/unpayBill" method="post" use:enhance>
                  <input
                    name="paymentId"
                    type="hidden"
                    value={payment.payments.id}
                  />
                  <button class="btn btn-sm variant-outline-secondary">
                    Unmark as paid
                  </button>
                </form>
              {/if}
            </svelte:fragment>
          </Header>
        </header>

        <section class="p-3">
          {#if payment.payments.paidAt !== null}
            <strong>
              Paid {payment.payments.paidAt.toLocaleString(undefined, {
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
