<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import Breadcrumb from '$lib/components/breadcrumb/breadcrumb.svelte';
  import { CrownIcon } from 'lucide-svelte';

  import Button from '$lib/components/button/button.svelte';
  import Drawer from '$lib/components/drawer/drawer.svelte';
  import HouseholdSidebar from '../_components/householdSidebar.svelte';

  export let data;
  export let form;

  let household = data.household;

  $: household = data.household;
  if (household === undefined) {
    goto('/dashboard/household');
  }

  let showDrawer = false;

</script>

<svelte:head>
  <title>
    Dashboard - {household.name} Household
  </title>
</svelte:head>

<Drawer on:close={() => showDrawer = false} open={showDrawer} let:close={closeDrawer}>
  <section class="p-4">
      <form action="?/editHousehold" class="flex flex-col gap-4" method="post">
        <h2 class="h2">
          Edit {household.name}
        </h2>
        <p class="text-surface-700-200-token">ID: {household.id}</p>

        <label class="label">
          <span>Household Name</span>
          <input
            name="household-name"
            type="text"
            class="input"
            value={household.name}
          />
        </label>

        <section class="flex gap-3">
          <Button variant="filled" on:click={() => closeDrawer()}>
            Close
          </Button>
          <Button>Save</Button>
        </section>
      </form>
  </section>
</Drawer>

<HouseholdSidebar
  households={data.households}
  userMap={data.streamable.userHouseholds}
/>

<div class="flex-grow flex flex-col gap-3 p-5">
  <Breadcrumb
    class="mt-4"
    crumbs={[
      {
        href: '/dashboard',
        link: 'Dashboard',
      },
      {
        href: '/dashboard/household',
        link: 'Households',
      },
      {
        href: `/dashboard/household/${household.id}`,
        link: household.name,
      },
    ]}
  />

  <header class="flex justify-between gap-4 items-center mb-4">
    <h1 class="h1">{household.name}</h1>
    <div class="actions flex gap-2">
      <Button
        size="sm"
        variant="primary:ghost"
        on:click={() => showDrawer = true}>Edit</Button
      >
      <Button size="sm" variant="destructive:ghost">Delete</Button>
    </div>
  </header>
  <div class="flex gap-4">
    <main class="flex-grow">
      {#await data.streamed.bills}
        <div class="placeholder animate-pulse" />
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

    <section
      class="w-1/4 bg-surface-300-600-token p-3 rounded flex flex-col gap-2"
    >
      <h4 class="h4">Members</h4>
      {#if data.session?.user && data.session.user.id === household.ownerId}
        <form
          method="post"
          action="?/inviteUsers"
          use:enhance={() => {
            return async ({ result }) => {
              // Not 100% why this works but ok
              form = {
                users: result.data.users,
              };
            };
          }}
        >
          <input type="hidden" name="household-id" value={household.id}>
          <textarea
            name="emails"
            class="textarea"
            placeholder="Invite new members by email"
          ></textarea>
          <button>Submit</button>
          {#if form?.users}
            {#each form.users as user}
              {user.userMetadata?.name}
              {user.email}
            {/each}
          {/if}
        </form>
      {/if}
      {#await data.streamable.userHouseholds}
        <div class="placeholder animate-pulse" />
      {:then userMap}
        {#if userMap[household.id]}
          {#each userMap[household.id].users as householdUser}
            <span class="inline-flex gap-2 items-center">
              {#if householdUser.id === household.ownerId}
                <CrownIcon size="0.9em" />
              {/if}
              {householdUser.userMetadata?.name || householdUser.email}
            </span>
          {/each}
        {/if}
      {:catch}
        Error occurred
      {/await}

      <h4 class="h4">Invites</h4>

      {#await data.streamed.invites}
        <div class="placeholder" />
      {:then invites}
        {#each invites as invite (invite.id)}
          <div>
            {JSON.stringify(invite)}
          </div>
        {:else}
          <em> No outstanding invites. </em>
        {/each}
      {:catch e}
        <strong>Error loading invites {e}</strong>
      {/await}
    </section>
  </div>
</div>

<style>
  .slide-in {
    animation: slide-in 200ms 1;
  }
  @keyframes slide-in {
    0% {
      transform: translateX(50%);
    }
    100% {
      transform: translateX(0);
    }
  }
</style>