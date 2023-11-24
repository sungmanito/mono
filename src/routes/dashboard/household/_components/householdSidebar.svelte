<script lang="ts">

  import Button from '$lib/components/button/button.svelte';
  import { PlusIcon } from 'lucide-svelte';
  import type { PageData } from '../$types';
  import HouseholdSideItem from './householdSideItem.svelte';
  import { page } from '$app/stores';
    import Modal from '$lib/components/modal/modal.svelte';

  export let households: PageData['households'];
  export let userMap: PageData['streamable']['userHouseholds'];

  let showModal = false;

</script>

<Modal
  open={showModal}
  modal
  action="/dashboard/household?/addHousehold"
  class="p-3 rounded variant-filled-surface"
  on:close={() => showModal = false }
>
  <svelte:fragment slot="header">
    Add household
  </svelte:fragment>
  <label for="">
    <input type="text" class="input px-2 py-1" placeholder="Household name">
  </label>
</Modal>

<section class="bg-surface-50-900-token p-4 overflow-auto min-w-max">
  <div class="flex flex-col gap-2">
    <header class="flex justify-between gap-4">
      <h3 class="h3">
        Households
      </h3>
      <section class="actions">
        <Button variant="primary" class="inline-flex gap-2 items-baseline" on:click={() => showModal = true}>
          <PlusIcon size="1em"/>
          Add
        </Button>
      </section>
    </header>
    {#each households as household (household.id) }
      <HouseholdSideItem
        household={household}
        userMap={userMap}
        selected={$page.params.id === household.id}
      />
    {/each}
  </div>
</section>