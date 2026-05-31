<script lang="ts">
  import { page } from '$app/state';
  import Header from '$lib/components/header/header.svelte';
  import { getHouseholdMembers } from '$lib/remotes/households.remote';
</script>

<svelte:boundary>
  {#snippet pending()}
    <div class="p-4 @container/name">
      <div class="h-8 w-32 rounded animate-pulse bg-surface-300 mb-4"></div>
      {#each Array(3) as _}
        <div class="h-12 rounded animate-pulse bg-surface-300 mb-2"></div>
      {/each}
    </div>
  {/snippet}

  {@const members = await getHouseholdMembers(page.params.id)}

  <div class="p-4 @container/name">
    <Header tag="h2">Members</Header>
    {#each members as member (member.id)}
      <div class="flex gap-3 p-2 border-b">
        <div>{member.email}</div>
        {#if member.isOwner}
          <span class="text-primary-400 text-sm">(Owner)</span>
        {/if}
      </div>
    {:else}
      <p>No members found.</p>
    {/each}
  </div>
</svelte:boundary>
