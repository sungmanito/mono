<script lang="ts">
  import Header from "$lib/components/header/header.svelte";
  import Modal from "$lib/components/modal/modal.svelte";
  import { Step, Stepper } from "@skeletonlabs/skeleton";

  export let data;

  let showModal = false;
</script>

<svelte:head>
  <title>Dashboard &ndash; Payments</title>
</svelte:head>

<Modal modal class="p-2 rounded bg-surface-800-100-token" open={showModal} on:close={() => showModal = false}>
  <svelte:fragment slot="header">
    Add payment
  </svelte:fragment>

  <div>
    <Stepper>
      <Step>
        <svelte:fragment slot="header">Hi</svelte:fragment>
        <input placeholder="hi" class="input px-2 py-1 variant-outline bg-surface-700-200-token" type="text">
      </Step>
    </Stepper>
  </div>


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

{#each data.payments as payment}
  <div>
    {payment.bills.billName} Payment for {payment.payments.forMonthD.toLocaleDateString(undefined, {
      month: 'long'
    })}
  </div>
{:else}
  <em>No Payments available</em>
{/each}