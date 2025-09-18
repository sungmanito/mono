<script lang="ts">
  import Button from '$lib/components/button/button.svelte';
  import Dropzone from '$lib/components/dropzone/dropzone.svelte';
  import FormLabel from '$lib/components/formLabel/formLabel.svelte';
  import Header from '$lib/components/header/header.svelte';
  import MonthDropdown from '$lib/components/monthDropdown/monthDropdown.svelte';
  import { uploadImage } from '$lib/remotes/payments.remote';
  import type { ModalifyPage } from '$lib/util/page';
  import { getToastStore } from '@skeletonlabs/skeleton';
  import { FileDownIcon, XIcon } from 'lucide-svelte';
  import type { PageData } from './$types';

  let {
    data,
    component = false,
    onclose = () => void 0,
  }: ModalifyPage<PageData> = $props();

  let file: File | null = $state(null);
  const toastStore = getToastStore();
</script>

<svelte:head>
  <title>Sungmanito &ndash; Create new payment</title>
</svelte:head>

<form
  class="p-6"
  enctype="multipart/form-data"
  {...uploadImage.enhance(async ({ submit }) => {
    try {
      await submit();
      onclose();
    } catch (e) {
      console.error(e);
    }
  })}
>
  <Header>
    Add payment info
    {#snippet actions()}
      {#if component}
        <button type="button" onclick={() => onclose()}>
          <XIcon size="1.5em" />
        </button>
      {/if}
    {/snippet}
  </Header>
  <div class="form-layout mt-8">
    <input type="hidden" name="paymentId" value={data.payment.id} />
    <input type="hidden" name="householdId" value={data.payment.householdId} />
    <div>
      <FormLabel label="Bill:">
        <input
          class="input"
          type="text"
          name="billName"
          readonly
          disabled
          value={data.payment.billName}
        />
      </FormLabel>
    </div>
    <div>
      <FormLabel label="For Month:">
        <MonthDropdown
          class="select"
          value={data.payment.forMonthD.getMonth()}
          readonly
          disabled
        />
      </FormLabel>
    </div>
    <div>
      <FormLabel label="Proof (optional):">
        <Dropzone
          name="proofFile"
          ondrop={(e, detail) => {
            if (detail.length > 1) {
              toastStore.trigger({
                message: 'Too many files',
                background: 'variant-filled-error',
              });
              return console.error('nope');
            }

            const [f] = detail;

            file = f.getAsFile();
          }}
        >
          {#snippet dragover()}
            <p>
              You can drop <strong>image</strong> files here
            </p>
          {/snippet}
          {#if file === null}
            <div class="flex gap-2 items-center">
              <FileDownIcon size="1.25em" />
              <p>Select a file here</p>
            </div>
          {:else}
            {@const blobUrl = URL.createObjectURL(file)}
            <div class="relative">
              <div class="absolute top-0 right-0">
                <button onclick={() => (file = null)}>
                  <XIcon size="1em" />
                </button>
              </div>
              <img src={blobUrl} alt={`Preview for ${file.name}`} />
            </div>
          {/if}
        </Dropzone>
      </FormLabel>
    </div>
    <div class="col-start-1">
      <FormLabel label="Amount paid (optional)">
        <input class="input" type="number" min="0" name="amount" step="0.01" />
      </FormLabel>
    </div>
    <div>
      <FormLabel label="Notes (optional)">
        <textarea
          class="textarea"
          name="proof"
          placeholder="Anything to note about this payment"
        ></textarea>
      </FormLabel>
    </div>
    <div class="col-span-4 flex gap-3 justify-end pt-6">
      {#if component}
        <Button variant="filled" type="button" onclick={onclose}>Close</Button>
      {/if}
      {#if data.payment.paidAt !== null}
        <Button
          variant="filled"
          type="submit"
          formaction="/dashboard/payments?/unpayBill"
        >
          Unpay
        </Button>
      {/if}
      <Button>Save</Button>
    </div>
  </div>
</form>

<style>
  .form-layout {
    display: grid;
    grid-template-columns: repeat(3, 1fr) minmax(20px, min-content);
    gap: theme('spacing.2');
  }
</style>
