<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto, preloadData, pushState } from '$app/navigation';
  import Breadcrumb from '$lib/components/breadcrumb/breadcrumb.svelte';
  import { CrownIcon, XIcon } from 'lucide-svelte';

  import Button from '$lib/components/button/button.svelte';
  import Drawer from '$lib/components/drawer/drawer.svelte';
  import DeleteHousehold from '$lib/components/households/delete.svelte';
  import HouseholdSidebar from '../_components/householdSidebar.svelte';
  import type { PageData as EditHouseholdData } from './edit/$types';
  import EditHousehold from './edit/+page.svelte';

  export let data;

  let household = data.household;

  let editHouseholdData: EditHouseholdData | null = null;

  $: household = data.household;
  if (household === undefined) {
    goto('/dashboard/household');
  }

  async function showEdit(householdId: string) {
    const data = await preloadData(`/dashboard/household/${householdId}/edit`);
    if (data.type === 'loaded' && data.status === 200) {
      editHouseholdData = data.data as EditHouseholdData;
      pushState(`/dashboard/household/${householdId}/edit`, {});
    }
  }

  let showDelete = false;
</script>

<svelte:head>
  <title>
    Dashboard - {household.name} Household
  </title>
</svelte:head>

{#if editHouseholdData !== null}
  <Drawer
    on:close={() => (editHouseholdData = null)}
    open={editHouseholdData !== null}
    let:close={closeDrawer}
  >
    <EditHousehold data={editHouseholdData} component onclose={closeDrawer} />
  </Drawer>
{/if}

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
        on:click={() => showEdit(household.id)}>Edit</Button
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
              <section class="p-4 pt-0">
                {#if bill.payments.length === 1}
                  {@const payment = bill.payments[0]}
                  Latest payment status:
                  {#if payment.paidAt !== null}
                    Paid ({payment.paidAt.toLocaleDateString(undefined)})
                  {:else}
                    Not Paid
                  {/if}
                {/if}
              </section>
            </div>
          {/each}
        </div>
      {/await}
    </main>

    <section
      class="w-1/4 bg-surface-300-600-token p-3 rounded flex flex-col gap-2"
    >
      <h4 class="h4">Members</h4>
      {#if data.user && data.user.id === household.ownerId}
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

            // Hate having to do this, but it's needed to solve #24
            // Should probably add a way to force arrays in the formData helpers
            if (emails.length === 1) {
              formData.append('emails', 'email@email.com');
            }

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
