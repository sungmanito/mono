<script lang="ts">
  import type { PageData } from './$types';

  import Button from '$lib/components/button/button.svelte';
  import { page } from '$app/state';
  import { enhance } from '$app/forms';
  export let data: PageData;
  export let component = false;
  export let onclose: () => void = () => void 0;

  let inputValue = '';
</script>

{#await data.bill}
  Loading...
{:then bill}
  {#if bill}
    <form
      action={`/dashboard/bills/${bill.id}/delete?/deleteBill`}
      method="post"
      use:enhance={({ cancel }) => {
        // Cancel the submit if the input value is not set to "delete"
        if (inputValue !== 'delete') cancel();

        return async ({ result, update }) => {
          if (result.type === 'success') {
            onclose();
            await update();
          }
        };
      }}
    >
      <div class="flex flex-col gap-2">
        <input type="hidden" name="bill-id" value={bill.id} />
        <div>
          Are you sure you want to delete &quot;{bill.billName}&quot;?
        </div>
        <div>Please type &quot;delete&quot; into here</div>
        <input
          type="text"
          name="confirmation"
          class="input"
          bind:value={inputValue}
        />
        <div class="flex gap-2 justify-end">
          <Button type="submit" disabled={inputValue !== 'delete'}>
            Delete
          </Button>
        </div>
      </div>
    </form>
  {:else}
    Could not find bill with id {page.params.id}
  {/if}
{/await}
