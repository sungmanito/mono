<script lang="ts">
  import { pushState } from '$app/navigation';
  import { page } from '$app/stores';
  import Drawerify from '$components/drawerify/drawerify.svelte';
  import Button from '$lib/components/button/button.svelte';
  import { PlusIcon } from 'lucide-svelte';
  import type { PageData } from '../$types';
  import CreateHouseholdComponent from '../create/+page.svelte';
  import HouseholdSideItem from './householdSideItem.svelte';

  export let households: PageData['households'];
  export let userMap: PageData['streamable']['userHouseholds'];

  let createDrawerOpen = false;

  async function loadCreate() {
    createDrawerOpen = true;
  }
</script>

<Drawerify
  component={CreateHouseholdComponent}
  bind:open={createDrawerOpen}
  url="/dashboard/household/create"
  on:close={() => {
    pushState('/dashboard/household', {});
  }}
  on:open={() => {
    pushState('/dashboard/household/create', {});
  }}
/>

<aside
  data-testid="sidebar-household"
  class="bg-surface-50-900-token p-4 overflow-auto min-w-max"
>
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
</aside>
