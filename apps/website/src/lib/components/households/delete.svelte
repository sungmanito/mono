<script lang="ts">
  import type { Household } from '$lib/remotes/households.remote';
  import { deleteHousehold } from '$lib/remotes/households.remote';
  import Button from '../button/button.svelte';
  import Modal from '../modal/modal.svelte';

  let {
    household,
    open = false,
    onclose = () => void 0,
  }: {
    household: Household;
    open?: boolean;
    onclose?: () => void;
  } = $props();

  let confirmation = $state('');
  let deleteFormEl: HTMLFormElement = $state()!;
</script>

<form
  bind:this={deleteFormEl}
  {...deleteHousehold.enhance(async ({ submit }) => {
    await submit();
    confirmation = '';
    onclose();
  })}
>
  <input type="hidden" name="householdId" value={household.id} />
  <Modal {open} modal {onclose} class="p-4 rounded shadow-xl">
    {#snippet header()}
      <h1>Delete &quot;{household.name}&quot;?</h1>
    {/snippet}
    {#snippet footer()}
      <div class="flex gap-2">
        <Button type="button" variant="filled" onclick={() => onclose()}>
          Close
        </Button>
        <Button
          type="button"
          disabled={confirmation !== 'delete'}
          onclick={() => deleteFormEl.requestSubmit()}
        >
          Delete
        </Button>
      </div>
    {/snippet}
    <section class="flex flex-col gap-3">
      <p>
        Deleting this household will also delete all bills and payments
        associated with it.
      </p>
      <p>
        <strong
          >Are you sure you want to delete &quot;{household.name}&quot;</strong
        >
      </p>
      <input
        class="input"
        bind:value={confirmation}
        placeholder={'Please type "delete" into here'}
      />
    </section>
  </Modal>
</form>
