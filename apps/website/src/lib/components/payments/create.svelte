<script lang="ts">
  import { getToastStore } from '@skeletonlabs/skeleton';
  import Drawer from '$lib/components/drawer/drawer.svelte';
  import Button from '../button/button.svelte';
  import FormLabel from '../formLabel/formLabel.svelte';
  import Header from '../header/header.svelte';
  import type { PageServerData } from '../../../routes/dashboard/payments/$types';
  import MonthDropdown from '../monthDropdown/monthDropdown.svelte';
  import { FileDownIcon, XIcon } from 'lucide-svelte';
  import Dropzone from '../dropzone/dropzone.svelte';
  import { enhance } from '$app/forms';
  import { invalidate } from '$app/navigation';

  export let payment: PageServerData['payments'][number];
  export let open = false;
  let file: File | null = null;

  const toastStore = getToastStore();
</script>

<Drawer {open} let:close={closeDrawer} on:close>
  <form
    class="p-6"
    action="/dashboard/payments?/updatePayment"
    method="post"
    enctype="multipart/form-data"
    use:enhance={({ formData }) => {
      if (file !== null) formData.set('proof-file', file);
      return async ({ formElement }) => {
        // await update();
        formElement.reset();
        await invalidate('household:payments');
        closeDrawer();
      };
    }}
  >
    <Header>
      Add payment info
      <svelte:fragment slot="actions">
        <button type="button" on:click={() => closeDrawer()}
          ><XIcon size="1.5em" /></button
        >
      </svelte:fragment>
    </Header>
    <div class="form-layout mt-8">
      <input type="hidden" name="payment-id" value={payment.payments.id} />
      <input
        type="hidden"
        name="household-id"
        value={payment.payments.householdId}
      />
      <div>
        <FormLabel label="Bill:">
          <input
            class="input"
            type="text"
            name="bill-name"
            readonly
            disabled
            value={payment.bills.billName}
          />
        </FormLabel>
      </div>
      <div>
        <FormLabel label="For Month:">
          <MonthDropdown
            class="select"
            value={payment.payments.forMonthD.getMonth()}
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
        <Button variant="filled" type="button" on:click={() => closeDrawer()}>
          Close
        </Button>
        <Button>Save</Button>
      </div>
    </div>
  </form>
</Drawer>

<style>
  .form-layout {
    display: grid;
    grid-template-columns: repeat(3, 1fr) minmax(20px, min-content);
    gap: theme('spacing.2');
  }
</style>
