<script lang="ts">
  import Dropzone from '$components/dropzone/dropzone.svelte';
  import FormLabel from '$components/formLabel/formLabel.svelte';
  import Button from '$lib/components/button/button.svelte';
  import Header from '$lib/components/header/header.svelte';
  import { uploadImage } from '$lib/remotes/payments.remote';
  import { getPaymentsForIds } from '$lib/remotes/payments.remote';
  import { XIcon } from 'lucide-svelte';
  import { fade } from 'svelte/transition';
  import { page } from '$app/state';
  import { isValid } from 'ulidx';

  let {
    component = false,
    onclose = () => void 0,
  }: { component?: boolean; onclose?: () => void } = $props();

  let previewUrls: Record<string, string> = $state({});
</script>

<svelte:head>
  <title>Dashboard &ndash; Make Payments</title>
</svelte:head>

<svelte:boundary>
  {#snippet pending()}
    <div class="@container/main mx-auto px-10 py-5">
      <div class="h-8 w-48 rounded animate-pulse bg-surface-300 mb-4"></div>
      {#each Array(3) as _}
        <div
          class="p-3 rounded-lg border bg-surface-backdrop-token border-surface-600 mb-3"
        >
          <div class="h-6 w-40 rounded animate-pulse bg-surface-300 mb-2"></div>
          <div class="h-12 rounded animate-pulse bg-surface-300 mb-2"></div>
          <div class="h-24 rounded animate-pulse bg-surface-300"></div>
        </div>
      {/each}
    </div>
  {/snippet}

  {@const paymentIds = page.url.searchParams
    .getAll('payments[]')
    .filter((id) => isValid(id))}
  {@const payments = await getPaymentsForIds(paymentIds)}

  <div class="@container/main mx-auto px-10 py-5">
    <Header color="secondary" tag="h2">
      Make Payments
      {#snippet actions()}
        {#if component}
          <button type="button" onclick={() => onclose()}>
            <XIcon size="1em" />
          </button>
        {/if}
      {/snippet}
    </Header>

    {#if payments.length > 0}
      <div class="flex flex-col gap-3 mt-4">
        {#each payments as payment (payment.id)}
          <form
            enctype="multipart/form-data"
            out:fade
            {...uploadImage.enhance(async ({ submit }) => {
              await submit();
            })}
          >
            <div
              class="p-3 rounded-lg flex flex-col gap-2 border bg-surface-backdrop-token border-surface-600"
            >
              <Header tag="h5" color="secondary" class="font-semibold">
                {payment.billName}
              </Header>
              <input type="hidden" name="paymentId" value={payment.id} />
              <input
                type="hidden"
                name="householdId"
                value={payment.householdId}
              />
              <FormLabel label="Amount Paid">
                <input
                  class="input"
                  type="number"
                  name="amount"
                  min="0"
                  step="0.01"
                  placeholder={payment.billAmount?.toLocaleString(undefined, {
                    style: 'currency',
                    currency: payment.billCurrency ?? 'USD',
                  }) ?? '0.00'}
                />
              </FormLabel>
              <FormLabel label="Receipt/Proof">
                <Dropzone
                  name="proofFile"
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
                        alt={`Proof of payment for ${payment.billName}`}
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
              <div class="flex justify-end">
                <Button type="submit">Pay</Button>
              </div>
            </div>
          </form>
        {/each}
      </div>
      <div class="flex justify-end gap-4 mt-4">
        {#if component}
          <Button type="button" variant="secondary" onclick={() => onclose()}>
            Close
          </Button>
        {/if}
      </div>
    {:else}
      <p class="mt-4">No payments to process.</p>
      {#if component}
        <Button
          type="button"
          variant="secondary"
          class="mt-4"
          onclick={() => onclose()}
        >
          Close
        </Button>
      {/if}
    {/if}
  </div>
</svelte:boundary>
