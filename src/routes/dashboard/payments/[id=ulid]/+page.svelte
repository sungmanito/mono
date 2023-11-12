<script lang="ts">
  import Header from "$lib/components/header/header.svelte";

  export let data;

  const monthYear = data
    .payment
    .payments
    .forMonthD
    .toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
</script>

<svelte:head>
  <title>{data.payment.bills.billName} {monthYear} Payment</title>
</svelte:head>

<Header class="mt-8">
  Payment for {data.payment.bills.billName}
  &ndash; {monthYear}
</Header>

Paid by {data.payment.users.userMetadata?.name} at

{
  data.payment.payments.paidAt?.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'full'})
}

{#if data.payment.payments.proof}
  <p class="first-line:font-bold first-line:text-xl">{data.payment.payments.proof}</p>
{/if}
