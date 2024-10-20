<script lang="ts">
  import Image from '$components/image/image.svelte';
  import UserInfo from '$components/userInfo/userInfo.svelte';
  import Header from '$lib/components/header/header.svelte';
  import { Accordion, AccordionItem } from '@skeletonlabs/skeleton';
  import { CheckIcon, XIcon } from 'lucide-svelte';

  interface Props { data: any, component?: boolean, onclose?: () => void }

  let { data, component = false, onclose = () => void 0 }: Props = $props();

  const monthYear = data.payment.forMonthD.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
</script>

<svelte:head>
  <title>{data.payment.bill.billName} {monthYear} Payment</title>
</svelte:head>

<div class="container mx-auto" class:px-4={component}>
  <Header class="mt-8">
    Payment for {data.payment.bill.billName}
    ({monthYear})
    <svelte:fragment slot="actions">
      {#if component}
        <button onclick={() => onclose()}>
          <XIcon size="1em" />
        </button>
      {/if}
    </svelte:fragment>
  </Header>

  {#if data.payment.paidAt !== null}
    {@const paidAt = data.payment.paidAt?.toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'full',
    })}
    <p>
      <strong>Paid at: </strong>{paidAt}
    </p>
    {#if data.payment.amount}
      {@const paymentNumber = Number(data.payment.amount)}
      <p>
        <strong>Paid:</strong> ${paymentNumber.toFixed(2)}
      </p>
    {/if}
  {:else}
    <strong>Payment Pending</strong>
  {/if}

  {#if data.payment.paymentImageUrl}
    <Image
      placeholderClass="w-64 h-32"
      class="mt-4"
      src={data.payment.paymentImageUrl}
      alt={`Uploaded on ${data.payment.paidAt?.toLocaleDateString()}`}
    />
  {/if}

  {#if data.payment.notes}
    <section class="mt-4 border p-3 rounded-lg">
      <div class="h3 mb-4">Notes</div>
      <blockquote class="blockquote">
        {data.payment.notes}
      </blockquote>

      <footer class="mt-4">
        {#if data.payment.payee}
          <UserInfo user={data.payment.payee} />
        {/if}
      </footer>
    </section>
  {/if}

  <Accordion>
    <AccordionItem>
      <svelte:fragment slot="summary">
        <Header tag="h2" class="my-4">Payment History</Header>
      </svelte:fragment>
      <svelte:fragment slot="content">
        {#await data.history}
          <div class="placeholder"></div>
          <div class="placeholder"></div>
          <div class="placeholder"></div>
        {:then pastPayments}
          {#each pastPayments as pastPayment (pastPayment.id)}
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
                    {
                      dateStyle: 'full',
                      timeStyle: 'full',
                    },
                  )}
                {/if}
              </div>
            </div>
          {:else}
            <p>No payment history for this bill</p>
          {/each}
        {/await}
      </svelte:fragment>
    </AccordionItem>
  </Accordion>
</div>
