<script lang="ts">
  import { getToastStore } from '@skeletonlabs/skeleton';
  import Button from '$lib/components/button/button.svelte';
  import FormLabel from '$lib/components/formLabel/formLabel.svelte';
  import Header from '$lib/components/header/header.svelte';
  import MonthDropdown from '$lib/components/monthDropdown/monthDropdown.svelte';
  import { FileDownIcon, XIcon } from 'lucide-svelte';
  import Dropzone from '$lib/components/dropzone/dropzone.svelte';
  import { enhance } from '$app/forms';
  import { invalidate } from '$app/navigation';

  export let data;
  export let component = false;
  export let onclose: () => void = () => void 0;
  let file: File | null = null;
  const toastStore = getToastStore();
</script>

<svelte:head>
  <title>Sungmanito &ndash; Create new payment</title>
</svelte:head>

<form
  class="p-6"
  action="/dashboard/payments?/updatePayment"
  method="post"
  enctype="multipart/form-data"
  use:enhance={({ formData }) => {
    if (file !== null) formData.set('proof-file', file);
    else formData.delete('proof-file');

    return async ({ formElement }) => {
      if (component) onclose();
      formElement.reset();
      await invalidate('household:payments');
    };
  }}
>
  <Header>
    Add payment info
    <svelte:fragment slot="actions">
      {#if component}
        <button type="button" on:click={() => onclose()}
          ><XIcon size="1.5em" /></button
        >
      {/if}
    </svelte:fragment>
  </Header>
  <div class="form-layout mt-8">
    <input type="hidden" name="payment-id" value={data.payment.id} />
    <input type="hidden" name="household-id" value={data.payment.householdId} />
    <div>
      <FormLabel label="Bill:">
        <input
          class="input"
          type="text"
          name="bill-name"
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
          name="proof-file"
          on:drop={(e) => {
            if (e.detail.length > 1) {
              toastStore.trigger({
                message: 'Too many files',
                background: 'variant-filled-error',
              });
              return console.error('nope');
            }

            const [f] = e.detail;

            file = f.getAsFile();
          }}
        >
          <svelte:fragment slot="drag-over">
            <p>
              You can drop <strong>image</strong> files here
            </p>
          </svelte:fragment>
          {#if file === null}
            <div class="flex gap-2 items-center">
              <FileDownIcon size="1.25em" />
              <p>Select a file here</p>
            </div>
          {:else}
            {@const blobUrl = URL.createObjectURL(file)}
            <div class="relative">
              <div class="absolute top-0 right-0">
                <button on:click={() => (file = null)}>
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
        <input class="input" type="number" min="0" />
      </FormLabel>
    </div>
    <div>
      <FormLabel label="Notes">
        <textarea
          class="textarea"
          name="proof"
          placeholder="Anything to note about this payment"
        ></textarea>
      </FormLabel>
    </div>
    <div class="col-span-4 flex gap-3 justify-end pt-6">
      {#if component}
        <Button variant="filled" type="button" on:click={onclose}>Close</Button>
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
