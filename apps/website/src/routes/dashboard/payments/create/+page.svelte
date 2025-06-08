<script lang="ts">
  import Dropzone from '$components/dropzone/dropzone.svelte';
  import FormLabel from '$components/formLabel/formLabel.svelte';
  import Header from '$lib/components/header/header.svelte';
  let { data } = $props();

  type PreviewUrlsMap = Record<(typeof data.payments)[number]['id'], string>;

  let previewUrls: PreviewUrlsMap = $state({});
</script>

<svelte:head>
  <title>Dashboard &ndash; Make Payments</title>
</svelte:head>

<div class="container mx-auto">
  <!-- Payment List -->
  <form action="?/makePayments" method="post">
    <div class="flex flex-col gap-3 mt-4">
      {#if data.payments && data.payments.length > 0}
        {#each data.payments as payment}
          <div
            class="p-3 rounded-lg flex flex-col gap-2 border border-surface-800"
          >
            <Header tag="h5" color="secondary" class="font-semibold">
              {payment.billName}
            </Header>
            <FormLabel label="Amount Paid">
              <input
                class="input"
                type="number"
                min="0"
                placeholder={payment.billAmount.toLocaleString(undefined, {
                  style: 'currency',
                  currency: payment.billCurrency,
                })}
              />
            </FormLabel>
            <FormLabel label="Receipt/Proof">
              <Dropzone
                onchange={(e) => {
                  const target = e.target as HTMLInputElement;
                  if (target.files!.length >= 1) {
                    const [file] = Array.from(target.files!);
                    previewUrls[payment.id] = URL.createObjectURL(file);
                  } else {
                    delete previewUrls[payment.id];
                  }
                }}
              >
                {#snippet children()}
                  {#if previewUrls[payment.id]}
                    <img
                      src={previewUrls[payment.id]}
                      alt="Something something"
                    />
                  {:else}
                    <div class="bg-surface-800">
                      Drag and drop a file here or click to select
                    </div>
                  {/if}
                {/snippet}
                {#snippet dragover()}
                  <div class="text-center text-surface-500">
                    Drop your file here
                  </div>
                {/snippet}
              </Dropzone>
            </FormLabel>
          </div>
        {/each}
      {:else}
        <p>No payments found.</p>
      {/if}
    </div>
  </form>
</div>
