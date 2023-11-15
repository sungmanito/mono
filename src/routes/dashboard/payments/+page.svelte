<script lang="ts">
  import Header from "$lib/components/header/header.svelte";
  import Modal from "$lib/components/modal/modal.svelte";
  import { Step, Stepper } from "@skeletonlabs/skeleton";
  import { CheckIcon } from "lucide-svelte";
  import { enhance } from '$app/forms';

  export let data;

  let showModal = false;
  let showUpdateModal = false;

  let paymentUpdater: typeof data.payments[0] | null = null;
</script>

<svelte:head>
  <title>Dashboard &ndash; Payments</title>
</svelte:head>

<Modal modal class="p-2 rounded bg-surface-800-100-token" open={showModal} on:close={() => showModal = false}>
  <svelte:fragment slot="header">
    Add payment
  </svelte:fragment>
  <Stepper>
    <Step>
      <svelte:fragment slot="header">Hi</svelte:fragment>
      <input placeholder="hi" class="input px-2 py-1 variant-outline bg-surface-700-200-token" type="text">
    </Step>
  </Stepper>
</Modal>

<Modal action="?/updatePayment" class="p-3 rounded bg-surface-active-token" modal open={showUpdateModal && paymentUpdater !== null} on:close={() => {
  showUpdateModal = false; paymentUpdater = null;
}}>
  <svelte:fragment slot="header">
    <Header tag="h4" color="secondary">
      {paymentUpdater?.bills.billName}
    </Header>
  </svelte:fragment>
  <section>
    <input type="hidden" name="payment-id" value={paymentUpdater?.payments.id} />
    <label class="flex flex-col gap-3">
      <span class="font-bold">Proof of payment</span>
      <input name="proof" placeholder="Confirmation number, etc." class="input px-2 py-1" />
    </label>
  </section>
  <svelte:fragment slot="footer">
    <button type="submit" class="btn variant-filled-primary">
      Save
    </button>
  </svelte:fragment>
</Modal>

<Header class="mt-4">
  Payments
  <svelte:fragment slot="actions">
    <button class="btn btn-sm variant-filled-primary" on:click={() => showModal = true}>
      Add payment
    </button>
  </svelte:fragment>
</Header>
<p class="font-xl font-semibold text-zinc-300">
  Includes payments from this month.
</p>

<div class="flex flex-col gap-3 mt-4">
  {#each data.payments as payment}
    <div class="card" class:variant-outline-success={payment.payments.paidAt !== null}>
      <header class="card-header">
        <Header tag="h5" color="secondary">
          <div class="flex gap-3">
            {#if payment.payments.paidAt !== null}
              <CheckIcon size="1em"/>
            {/if}
            {payment.bills.billName}
          </div>
          <svelte:fragment slot="actions">
            {#if payment.payments.paidAt === null}
              <button
                class="btn btn-sm variant-outline-primary"
                type="button"
                on:click={() => {
                  paymentUpdater = payment;
                  showUpdateModal = true;
                }}
              >
                Mark as paid
              </button>
            {:else}
              <form action="?/unpayBill" method="post" use:enhance>
                <input name="paymentId" type="hidden" value={payment.payments.id} >
                <button
                  class="btn btn-sm variant-outline-secondary"
                >
                  Unmark as paid
                </button>
              </form>
            {/if}
          </svelte:fragment>
        </Header>
      </header>
      
      <section class="p-3">
        {#if payment.payments.paidAt !== null}
          <strong>Paid {payment.payments.paidAt.toLocaleString(undefined, { month: 'long', day: 'numeric', hour: '2-digit', hour12: true, minute: '2-digit',  })}</strong>
        {:else}
          <em>Waiting for payment...</em>
        {/if}
      </section>
    </div>
  {:else}
    <em>No Payments available</em>
  {/each}
</div>