<script lang="ts">
  import { pushState } from '$app/navigation';
  import { page } from '$app/state';
  import Drawerify from '$components/drawerify/drawerify.svelte';
  import Header from '$components/header/header.svelte';
  import Button from '$lib/components/button/button.svelte';
  import { PlusIcon } from 'lucide-svelte';
  import {
    getUserHouseholdsWithBillCount,
    getUserHouseholdsWithMembers,
    getPendingInvites,
  } from '$lib/remotes/households.remote';
  import CreateHouseholdComponent from '../create/+page.svelte';
  import HouseholdSidebarInvite from './householdSidebarInvite.svelte';
  import HouseholdSideItem from './householdSideItem.svelte';

  let createDrawerOpen = $state(false);
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

<svelte:boundary>
  {#snippet pending()}
    <aside class="bg-surface-100-800-token p-4 overflow-auto min-w-max">
      <div class="h-6 w-32 rounded animate-pulse bg-surface-300 mb-4"></div>
      {#each Array(3) as _}
        <div class="h-16 rounded animate-pulse bg-surface-300 mb-2"></div>
      {/each}
    </aside>
  {/snippet}

  {@const households = await getUserHouseholdsWithBillCount()}
  {@const userMap = getUserHouseholdsWithMembers()}
  {@const invites = getPendingInvites()}

  <aside data-testid="sidebar-household" class="bg-surface-100-800-token p-4 overflow-auto min-w-max">
    <div class="flex flex-col gap-2">
      <Header tag="h3" color="secondary" class="gap-4">
        Households
        {#snippet actions()}
          <Button
            variant="primary"
            class="inline-flex gap-2 items-baseline"
            onclick={() => (createDrawerOpen = true)}
          >
            <PlusIcon size="1em" />
            Add
          </Button>
        {/snippet}
      </Header>

      {#each households as household (household.id)}
        <HouseholdSideItem {household} {userMap} selected={page.params.id === household.id} />
      {/each}

      <Header tag="h3" color="secondary" class="gap-4">Invites</Header>
      <HouseholdSidebarInvite {invites} />
    </div>
  </aside>
</svelte:boundary>
