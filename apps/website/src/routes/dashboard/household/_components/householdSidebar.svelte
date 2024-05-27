<script lang="ts">
  import { preloadData } from '$app/navigation';
  import { page } from '$app/stores';
  import Button from '$lib/components/button/button.svelte';
  import Drawer from '$lib/components/drawer/drawer.svelte';
  import { PlusIcon } from 'lucide-svelte';
  import type { PageData } from '../$types';
  import type { PageData as CreateHouseholdData } from '../create/$types';
  import CreateHouseholdComponent from '../create/+page.svelte';
  import HouseholdSideItem from './householdSideItem.svelte';

  export let households: PageData['households'];
  export let userMap: PageData['streamable']['userHouseholds'];

  let createHouseholdData: CreateHouseholdData | null = null;

  async function loadCreate() {
    const data = await preloadData('/dashboard/household/create');
    if (data.type === 'loaded' && data.status === 200) {
      createHouseholdData = data.data as CreateHouseholdData;
    }
  }
</script>

{#if createHouseholdData !== null}
  <Drawer
    open={createHouseholdData !== null}
    let:close={closeDrawer}
    on:close={() => (createHouseholdData = null)}
  >
    <CreateHouseholdComponent component={true} onclose={closeDrawer} />
  </Drawer>
{/if}

<section class="bg-surface-50-900-token p-4 overflow-auto min-w-max">
  <div class="flex flex-col gap-2">
    <header class="flex justify-between gap-4 mb-4">
      <h3 class="h3">Households</h3>
      <section class="actions">
        <Button
          variant="primary"
          class="inline-flex gap-2 items-baseline"
          on:click={() => loadCreate()}
        >
          <PlusIcon size="1em" />
          Add
        </Button>
      </section>
    </header>
    {#each households as household (household.id)}
      <HouseholdSideItem
        {household}
        {userMap}
        selected={$page.params.id === household.id}
      />
    {/each}
  </div>
</section>
