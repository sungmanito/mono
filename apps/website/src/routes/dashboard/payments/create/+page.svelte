<script lang="ts">
  import { enhance } from '$app/forms';
  import Dropzone from '$components/dropzone/dropzone.svelte';
  import FormLabel from '$components/formLabel/formLabel.svelte';
  import Button from '$lib/components/button/button.svelte';
  import Header from '$lib/components/header/header.svelte';
  import type { DrawerifyPage } from '$lib/util/page';
  import { XIcon } from 'lucide-svelte';
  import { fade } from 'svelte/transition';
  import type { PageData } from './$types';

  type Props = DrawerifyPage<PageData>;
  let { data, component = false, onclose = () => void 0 }: Props = $props();

  type PreviewUrlsMap = Record<(typeof data.payments)[number]['id'], string>;

  let previewUrls: PreviewUrlsMap = $state({});

  let paymentsData = $state(data.payments);
</script>

<svelte:head>
  <title>Dashboard &ndash; Make Payments</title>
</svelte:head>

<div class="@container/main mx-auto px-10 py-5">
  <!-- Payment List -->
  <form
    action="/dashboard/payments?/massPay"
    method="post"
    enctype="multipart/form-data"
    use:enhance={async () => {
      return async () => {
        onclose();
      };
    }}
  >
    <div class="flex flex-col gap-3 mt-4">
      {#if paymentsData && paymentsData.length > 0}
        {#each paymentsData as payment, index (payment.id)}
          <div
            class="p-3 rounded-lg flex flex-col gap-2 border bg-surface-backdrop-token border-surface-600"
            out:fade
          >
            <Header tag="h5" color="secondary" class="font-semibold">
              {payment.billName}
              {#snippet actions()}
                <button
                  type="button"
                  class="bg-surface-hover-token p-1 rounded-full"
                  onclick={() => {
                    paymentsData.splice(index, 1);
                  }}
                >
                  <XIcon size="1em" />
                </button>
              {/snippet}
            </Header>
            <input
              type="hidden"
              name={`${payment.id}[householdId]`}
              value={payment.householdId}
            />
            <FormLabel label="Amount Paid">
              <input
                class="input"
                type="number"
                name={`${payment.id}[amountPaid]`}
                min="0"
                defaultValue={0}
                placeholder={payment.billAmount.toLocaleString(undefined, {
                  style: 'currency',
                  currency: payment.billCurrency,
                })}
              />
            </FormLabel>
            <FormLabel label="Receipt/Proof">
              <Dropzone
                name={`${payment.id}[receipt]`}
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
          </div>
        {/each}
      {:else}
        <p>
          You are currently accessing this page without any query parameters.
        </p>
      {/if}
      <div class="flex justify-end gap-4">
        {#if component}
          <Button
            type="button"
            variant="secondary"
            onclick={() => {
              onclose();
            }}
          >
            Close
          </Button>
        {/if}
        <Button type="submit">Pay all</Button>
      </div>
    </div>
  </form>
</div>
