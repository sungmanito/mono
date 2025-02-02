<script lang="ts" module>
  export interface HouseholdSidebarProps {
    households: PageData['households'];
    userMap: PageData['streamable']['userHouseholds'];
    invites: PageData['invites'];
  }
</script>

<script lang="ts">
  import { pushState } from '$app/navigation';
  import { page } from '$app/state';
  import Drawerify from '$components/drawerify/drawerify.svelte';
  import Header from '$components/header/header.svelte';
  import Button from '$lib/components/button/button.svelte';
  import { PlusIcon } from 'lucide-svelte';
  import type { PageData } from '../$types';
  import CreateHouseholdComponent from '../create/+page.svelte';
  import HouseholdSidebarInvite from './householdSidebarInvite.svelte';
  import HouseholdSideItem from './householdSideItem.svelte';

  let { households, userMap, invites }: HouseholdSidebarProps = $props();

  let createDrawerOpen = $state(false);

  async function loadCreate() {
    createDrawerOpen = true;
  }
</script>

<Drawerify
  component={CreateHouseholdComponent}
  bind:open={createDrawerOpen}
  url="/dashboard/household/create"
  onclose={() => {
    pushState('/dashboard/household', {});
  }}
  onopen={() => {
    pushState('/dashboard/household/create', {});
  }}
/>

<aside
  data-testid="sidebar-household"
  class="bg-surface-100-800-token p-4 overflow-auto min-w-max"
>
  <div class="flex flex-col gap-2">
    <Header tag="h3" color="secondary" class="gap-4">
      Households
      {#snippet actions()}
        <Button
          variant="primary"
          class="inline-flex gap-2 items-baseline"
          onclick={() => loadCreate()}
        >
          <PlusIcon size="1em" />
          Add
        </Button>
      {/snippet}
    </Header>

    {#each households as household (household.id)}
      <HouseholdSideItem
        {household}
        {userMap}
        selected={page.params.id === household.id}
      />
    {/each}

    <Header tag="h3" color="secondary" class="gap-4">Invites</Header>
    <HouseholdSidebarInvite {invites} />
  </div>
</aside>
