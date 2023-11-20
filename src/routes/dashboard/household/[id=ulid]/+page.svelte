<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import Breadcrumb from '$lib/components/breadcrumb/breadcrumb.svelte';
  import { CrownIcon } from 'lucide-svelte';

  import { page } from "$app/stores";

  export let data;
  export let form;

  let household = data.household;

  $: household = data.household;
  if(household === undefined) {
    goto('/dashboard/household')
  }

</script>

<svelte:head>
  <title>
    Dashboard - {household.name} Household
  </title>
</svelte:head>

<aside class="p-3 min-w-[15%] flex flex-col bg-surface-50-900-token gap-2 overflow-auto">
  <h3 class="h3">Teams</h3>
  
  {#each data.households as household}
    <div class="p-3 rounded" class:variant-filled-primary={household.households.id === data.household.id}>
      <a href={`/dashboard/household/${household.households.id}`} class="inline-flex gap-2 items-center">
        {#if household.households.ownerId === data.user.id}
          <span title="Owner">
            <CrownIcon size="1em" />
          </span>
        {/if}
         {household.households.name}
      </a>
      <div>
        {#await data.streamed.householdUsers}
          <div class="placeholder animate-pulse"></div>
        {:then householdMap} 
          {#if householdMap[household.households.id]}
            {householdMap[household.households.id].length} member(s)
          {:else}
            1 member
          {/if}
        {/await}
      </div>
    </div>
  {/each}
  
</aside>

<div class="flex-grow flex flex-col gap-3 px-3">
  <Breadcrumb class="mt-4" crumbs={[
    {
      href: '/dashboard',
      link: 'Dashboard'
    },
    {
      href: '/dashboard/household',
      link: 'Households'
    },
    {
      href: `/dashboard/household/${household.id}`,
      link: household.name
    }
  ]} />
  
  <h1 class="h1">{household.name}</h1>
  <div class="flex gap-4">

    <main class="flex-grow">
      {#await data.streamed.bills}
        <div class="placeholder animate-pulse"></div>
      {:then bills}
        <div class="flex flex-col gap-3">
          {#each bills as bill}
            <div class="bill card variant-filled-primary">
              <header class="card-header pb-3">
                {bill.billName} due on the {bill.dueDate} of each month
              </header>
            </div>
          {/each}
        </div>
      {/await}
    </main> 
        
  
    <section class="w-1/6 bg-surface-300-600-token p-3 rounded flex flex-col gap-2">
      <h4 class="h4">
        Members
      </h4>
      <form method="post" action="?/findUser" use:enhance={() => {
        return async ({
          result
        }) => {
          // Not 100% why this works but ok
          form = {
            users: result.data.users,
          }
        }
      }}>
        <input type="text" name="user" class="input px-2 py-1" placeholder="Invite a new user">
        {#if form?.users}
          {#each form.users as user}
            {user.userMetadata?.name}
            {user.email}
          {/each}
        {/if}
      </form>
      {#await data.streamed.householdUsers}
        <div class="placeholder animate-pulse"></div>
      {:then userMap}
        {#if userMap[household.id]}
          {#each userMap[household.id] as householdUser}
            <span class="inline-flex gap-2 items-center">

              {#if householdUser.id === household.ownerId}
                <CrownIcon size="0.9em" />
              {/if}
              {householdUser.userMetadata?.name || householdUser.email}
            </span>
          {/each}
        {/if}
      {/await}
    </section>
  </div>

</div>
