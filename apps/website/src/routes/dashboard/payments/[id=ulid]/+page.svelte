<script lang="ts">
  import Image from '$components/image/image.svelte';
  import UserInfo from '$components/userInfo/userInfo.svelte';
  import Header from '$lib/components/header/header.svelte';
  import { CheckIcon, XIcon } from 'lucide-svelte';
  import { page } from '$app/state';
  import { getPaymentWithDetails } from '$lib/remotes/payments.remote';

  let {
    component = false,
    onclose = () => void 0,
  }: { component?: boolean; onclose?: () => void } = $props();
</script>

<svelte:head>
  <title>Dashboard &ndash; Payment</title>
</svelte:head>

<svelte:boundary>
  {#snippet pending()}
    <div class="container mx-auto px-4">
      <div
        class="h-8 w-64 rounded animate-pulse bg-surface-300 mt-8 mb-4"
      ></div>
      <div class="h-4 w-48 rounded animate-pulse bg-surface-300 mb-2"></div>
      <div class="h-4 w-32 rounded animate-pulse bg-surface-300 mb-4"></div>
      <div class="h-48 w-full rounded animate-pulse bg-surface-300 mb-4"></div>
      <div class="h-32 w-full rounded animate-pulse bg-surface-300"></div>
    </div>
  {/snippet}

  {@const payment = await getPaymentWithDetails(page.params.id)}
  {@const monthYear = payment.forMonthD.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })}

  <div class="container mx-auto" class:px-4={component}>
    <Header class="mt-8">
      Payment for {payment.bill.billName}
      ({monthYear})
      {#snippet actions()}
        {#if component}
          <button onclick={() => onclose()}>
            <XIcon size="1em" />
          </button>
        {/if}
      {/snippet}
    </Header>

    {#if payment.paidAt !== null}
      {@const paidAt = payment.paidAt?.toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'full',
      })}
      <p><strong>Paid at: </strong>{paidAt}</p>
      {#if payment.amount}
        {@const paymentNumber = Number(payment.amount)}
        <p><strong>Paid:</strong> ${paymentNumber.toFixed(2)}</p>
      {/if}
    {:else}
      <strong>Payment Pending</strong>
    {/if}

    {#if payment.paymentImageUrl}
      <Image
        placeholderClass="w-64 h-32"
        class="mt-4"
        src={payment.paymentImageUrl}
        alt={`Uploaded on ${payment.paidAt?.toLocaleDateString()}`}
      />
    {/if}

    {#if payment.notes}
      <section class="mt-4 border p-3 rounded-lg">
        <div class="h3 mb-4">Notes</div>
        <blockquote class="blockquote">{payment.notes}</blockquote>
        <footer class="mt-4">
          {#if payment.payee}
            <UserInfo user={payment.payee} />
          {/if}
        </footer>
      </section>
    {/if}

    {#if payment.history.length > 0}
      <section class="mt-6">
        <Header tag="h2" class="my-4">Payment History</Header>
        <div class="flex flex-col gap-3">
          {#each payment.history as pastPayment (pastPayment.id)}
            {@const paymentDateString =
              pastPayment.forMonthD.toLocaleDateString(undefined, {
                month: 'long',
                year: 'numeric',
              })}
            <div
              class="card"
              class:variant-filled-primary={pastPayment.paidAt !== null}
            >
              <div class="card-header flex items-center gap-4">
                {#if pastPayment.paidAt !== null}
                  <CheckIcon size="1em" />
                {/if}
                <a href={`/dashboard/payments/${pastPayment.id}`}>
                  {paymentDateString}
                </a>
              </div>
              <div class="card-footer">
                {#if pastPayment.paidAt !== null && pastPayment.payee !== null}
                  Paid by {pastPayment.payee.email} on {pastPayment.paidAt.toLocaleString(
                    undefined,
                    { dateStyle: 'full', timeStyle: 'full' },
                  )}
                {/if}
              </div>
            </div>
          {:else}
            <p>No payment history for this bill</p>
          {/each}
        </div>
      </section>
    {/if}
  </div>
</svelte:boundary>
