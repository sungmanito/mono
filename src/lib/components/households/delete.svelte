<script lang="ts">
  import { goto, invalidateAll } from "$app/navigation";
  import type { Household } from "$lib/server/actions/households.actions";
  import Button from "../button/button.svelte";
  import Modal from "../modal/modal.svelte";

  export let household: Household;
  export let open = false;
  let confirmation = '';

</script>

<Modal {open} on:close modal action="/dashboard/household?/deleteHousehold" class="p-4 rounded shadow-xl" submitFn={async () => {
  await goto('/dashboard/household');
  await invalidateAll();
}}>
  <svelte:fragment slot="header">
    <h1>Delete &quot;{household.name}&quot;?</h1>
  </svelte:fragment>

  <input type="hidden" name="household-id" value={household.id}>

  <section class="flex flex-col gap-3">
    <p>
      Deleting this household will also delete all bills and payments associated with it.
    </p>
    <p><strong>Are you sure you want to delete &quot;{household.name}&quot;</strong></p>
    <input class="input" bind:value={confirmation} placeholder={'Please type "delete" into here'}/>
  </section>

  <svelte:fragment slot="footer" let:close>
    <div class="flex gap-2">
      <Button type="button" variant="filled" on:click={() => close()}>
        Close
      </Button>
      <Button type="submit" disabled={confirmation !== 'delete'}>
        Delete
      </Button>
    </div>
  </svelte:fragment>
</Modal>