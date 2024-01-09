<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto, invalidateAll } from '$app/navigation';
  import Breadcrumb from '$lib/components/breadcrumb/breadcrumb.svelte';
  import { CrownIcon, XIcon } from 'lucide-svelte';

  import Button from '$lib/components/button/button.svelte';
  import Drawer from '$lib/components/drawer/drawer.svelte';
  import HouseholdSidebar from '../_components/householdSidebar.svelte';
  import DeleteHousehold from '$lib/components/households/delete.svelte';

  export let data;

  let household = data.household;

  $: household = data.household;
  if (household === undefined) {
    goto('/dashboard/household');
  }

  let showDrawer = false;
  let showDelete = false;
</script>

<svelte:head>
  <title>
    Dashboard - {household.name} Household
  </title>
</svelte:head>

<Drawer
  on:close={() => (showDrawer = false)}
  open={showDrawer}
  let:close={closeDrawer}
>
  <section class="p-4">
    <form
      action="/dashboard/household?/updateHousehold"
      class="flex flex-col gap-4"
      method="post"
      use:enhance={() => {
        return async ({ formElement, update }) => {
          await update();
          formElement.reset();
          showDrawer = false;
          await invalidateAll();
        };
      }}
    >
      <input type="hidden" name="household-id" value={household.id} />
      <h2 class="h2">
        Edit {household.name}
      </h2>
      <p class="text-surface-700-200-token">ID: {household.id}</p>

      <label class="label">
        <span>Household Name</span>
        <input name="name" type="text" class="input" value={household.name} />
      </label>

      <section class="flex gap-3">
        <Button variant="filled" on:click={() => closeDrawer()}>Close</Button>
        <Button>Save</Button>
      </section>
    </form>
  </section>
</Drawer>

<HouseholdSidebar
  households={data.households}
  userMap={data.streamable.userHouseholds}
/>

<DeleteHousehold
  {household}
  open={showDelete}
  on:close={() => (showDelete = false)}
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
        on:click={() => (showDrawer = true)}>Edit</Button
      >
      <Button
        size="sm"
        variant="destructive:ghost"
        on:click={() => (showDelete = true)}>Delete</Button
      >
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
          use:enhance={({ formData, cancel }) => {
            const rawEmails = formData.get('emails');
            formData.delete('emails');

            if (typeof rawEmails !== 'string') {
              return cancel();
            }

            const emails = rawEmails.split(/\r?\n/);

            for (const email of emails) {
              formData.append('emails', email);
            }

            return async () => {
              // Not 100% why this works but ok
            };
          }}
        >
          <input type="hidden" name="household-id" value={household.id} />
          <textarea
            name="emails"
            class="textarea"
            placeholder="Invite new members by email"
          ></textarea>
          <button class="btn btn-sm variant-filled-primary mt-4">Submit</button>
        </form>
      {/if}
      {#await data.streamable.userHouseholds}
        <div class="placeholder animate-pulse" />
      {:then userMap}
        {#if userMap[household.id]}
          <form action="?/removeMember" method="post" use:enhance>
            {#each userMap[household.id].users as householdUser}
              <div class="flex gap-2 items-center">
                <div class="flex gap-2 items-center">
                  {#if householdUser.id === household.ownerId}
                    <CrownIcon size="0.9em" />
                  {/if}
                  {householdUser.userMetadata?.name || householdUser.email}
                </div>
                {#if (household.ownerId === data.user.id && householdUser.id !== household.ownerId) || householdUser.id === data.user.id}
                  <button
                    name="userId"
                    value={householdUser.id}
                    class="btn-icon btn-icon-sm hover:variant-outline-error"
                  >
                    <XIcon size="1em" />
                  </button>
                {/if}
              </div>
            {/each}
          </form>
        {/if}
      {:catch}
        Error occurred
      {/await}

      <h4 class="h4">Invites</h4>

      {#await data.streamed.invites}
        <div class="placeholder" />
      {:then invites}
        <form action="?/deleteInvite" method="post" use:enhance>
          {#each invites as invite (invite.id)}
            <div class="flex gap-2 items-center">
              {invite.toEmail}
              <button
                name="invite-id"
                value={invite.id}
                class="btn-icon btn-icon-sm hover:variant-filled-error"
              >
                <XIcon size="0.9em" />
              </button>
            </div>
          {:else}
            <em> No outstanding invites. </em>
          {/each}
        </form>
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
