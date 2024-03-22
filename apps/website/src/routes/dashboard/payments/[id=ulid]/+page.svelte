<script lang="ts">
  import Header from '$lib/components/header/header.svelte';

  export let data;

  const monthYear = data.payment.forMonthD.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
</script>

<svelte:head>
  <title>{data.payment.bill.billName} {monthYear} Payment</title>
</svelte:head>

<div class="container mx-auto">
  <Header class="mt-8">
    Payment for {data.payment.bill.billName}
    ({monthYear})
  </Header>

  {data.payment.paidAt?.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'full',
  })}

  {#if data.payment.paymentImageUrl}
    <img
      src={data.payment.paymentImageUrl}
      alt={`Uploaded on ${data.payment.paidAt?.toLocaleDateString()}`}
    />
  {/if}

  {#if data.payment.proof}
    <p class="first-line:font-bold first-line:text-xl">
      {JSON.stringify(data.payment.proof)}
    </p>
  {/if}
</div>
