<script lang="ts">

  import Button from '$lib/components/button/button.svelte';
  import { PlusIcon } from 'lucide-svelte';
  import type { PageData } from '../$types';
  import HouseholdSideItem from './householdSideItem.svelte';
  import { page } from '$app/stores';

  export let households: PageData['households'];
  export let userMap: PageData['streamed']['userHouseholds'];

</script>


<section class="bg-surface-50-900-token p-4 overflow-auto">
  <div class="flex flex-col gap-2">
    <header class="flex justify-between gap-4">
      <h3 class="h3">
        Households
      </h3>
      <section class="actions">
        <Button variant="primary" class="inline-flex gap-2 items-baseline" on:click>
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