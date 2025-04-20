<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto, pushState, invalidate } from '$app/navigation';
  import Breadcrumb from '$lib/components/breadcrumb/breadcrumb.svelte';
  import {
    AlertTriangleIcon,
    CrownIcon,
    Loader2,
    Trash2Icon,
    XIcon,
  } from 'lucide-svelte';

  import Drawerify from '$components/drawerify/drawerify.svelte';
  import Header from '$components/header/header.svelte';
  import Button from '$lib/components/button/button.svelte';
  import DeleteHousehold from '$lib/components/households/delete.svelte';
  import BillDetails from '../../bills/[id=ulid]/+page.svelte';
  import EditHousehold from './edit/+page.svelte';
  import CreateBillPage from '../../bills/create/+page.svelte';
  import DeleteBillPage from '../../bills/[id=ulid]/delete/+page.svelte';
  import Modalify from '$components/modalify/modalify.svelte';
  import Alert from '$components/alert/alert.svelte';

  let { data } = $props();

  let household = $derived(data.household);

  let billDetailUrl = $state('');
  let showBillDetails = $state(false);

  let editBillUrl = $state('');
  let showEditHousehold = $state(false);
  let showCreateBill = $state(false);
  let showCreateBillUrl = $state('');

  $effect(() => {
    if (household === undefined) {
      goto('/dashboard/household');
    }
  });

  function showEdit(householdId: string) {
    showEditHousehold = true;
    editBillUrl = `/dashboard/household/${householdId}/edit`;
  }

  let showDeleteBill = $state(false);
  let deleteBillId = $state('');

  let showDelete = $state(false);
</script>

<svelte:head>
  <title>
    Household - {household.name}
  </title>
</svelte:head>

<Drawerify
  bind:open={showBillDetails}
  onopen={() => {
    pushState(billDetailUrl, {});
  }}
  onclose={() => {
    showBillDetails = false;
    billDetailUrl = '';
    pushState(`/dashboard/household/${household.id}`, {});
  }}
  component={BillDetails}
  url={billDetailUrl}
/>

<Modalify
  bind:open={showDeleteBill}
  url={`/dashboard/bills/${deleteBillId}/delete`}
  component={DeleteBillPage}
  onclose={() => (showDeleteBill = false)}
>
  {#snippet header({ data })}
    Delete Bill
    {#await data?.bill}
      <Loader2 size="1em" />
    {:then billData}
      {#if billData}
        &ndash; {billData.billName}
      {/if}
    {/await}
  {/snippet}
  {#snippet footer()}
    &nbsp;
  {/snippet}
</Modalify>

<Drawerify
  bind:open={showCreateBill}
  url={showCreateBillUrl}
  component={CreateBillPage}
/>

<Drawerify
  url={editBillUrl}
  bind:open={showEditHousehold}
  onopen={() => {
    pushState(editBillUrl, {});
  }}
  onclose={() => {
    showEditHousehold = false;
    editBillUrl = '';
    pushState(`/dashboard/household/${household.id}`, {});
  }}
  component={EditHousehold}
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

  {#if household.ownerId === null}
    <Alert type="warning:ghost">
      <div class="flex items-center gap-4">
        <AlertTriangleIcon size="2em" />
        <div class="flex flex-col">
          <Header tag="h3">Ownerless Household</Header>
          <p>
            You are viewing a household whose original owner has been removed,
            either at their request or by administrators. Households who do not
            have owners will be removed periodically. Please use the action to
            the side in order to take ownership of this household.
          </p>
        </div>
      </div>
      {#snippet actions()}
        <form action="?/claimHousehold" method="post" use:enhance>
          <Button type="submit" variant="filled">Claim household</Button>
        </form>
      {/snippet}
    </Alert>
  {/if}

  <header class="flex justify-between gap-4 items-center mb-4">
    <h1 class="h1">{household.name}</h1>
    <div class="actions flex gap-2">
      <Button
        size="sm"
        variant="primary:ghost"
        onclick={() => showEdit(household.id)}>Edit</Button
      >
      <Button
        size="sm"
        variant="destructive:ghost"
        onclick={() => (showDelete = true)}>Delete</Button
      >
    </div>
  </header>
  <div class="flex gap-4">
    <main class="flex-grow">
      <Header tag="h3">
        {#snippet actions()}
          <Button
            size="sm"
            variant="secondary"
            onclick={() => {
              showCreateBillUrl = `/dashboard/bills/create?household-id[]=${household.id}`;
              showCreateBill = true;
            }}
          >
            Add</Button
          >
        {/snippet}
        Bills
      </Header>
      {#await data.streamed.bills}
        <div class="placeholder animate-pulse"></div>
      {:then bills}
        <div class="flex flex-col gap-3" role="list">
          {#each bills as bill}
            <div role="listitem" class="bill card variant-soft-surface">
              <header
                class="card-header pb-3 flex justify-between items-baseline"
              >
                <a
                  href={`/dashboard/bills/${bill.id}`}
                  class="text-xl font-semibold"
                  on:click|preventDefault={() => {
                    billDetailUrl = `/dashboard/bills/${bill.id}`;
                    showBillDetails = true;
                  }}
                >
                  {bill.billName} due on the {bill.dueDate} of each month
                </a>
                <section>
                  <Button
                    variant="destructive:ghost"
                    onclick={() => {
                      showDeleteBill = true;
                      deleteBillId = bill.id;
                      pushState(`/dashboard/bills/${bill.id}/delete`, {});
                    }}
                  >
                    <Trash2Icon size="1em" />
                  </Button>
                </section>
              </header>
              <section class="p-4 pt-0">
                {#if bill.payments.length === 1}
                  {@const payment = bill.payments[0]}
                  Latest payment status:
                  {#if payment.paidAt !== null}
                    Paid ({payment.paidAt.toLocaleString(undefined)})
                  {:else}
                    Not Paid
                  {/if}
                {/if}
              </section>
            </div>
          {:else}
            This household currently does not have any bills. Please use the
            &quot;Add&quot; button above
          {/each}
        </div>
      {/await}
    </main>

    <section
      class="w-1/4 bg-surface-300-600-token p-3 rounded flex flex-col gap-2"
    >
      <Header tag="h4">Members</Header>
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

            return async ({ formElement }) => {
              // Not 100% why this works but ok
              await invalidate('user:households');
              formElement.reset();
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
  dt {
    font-weight: bold;
  }
  dd {
    margin-left: 1.5em;
  }
</style>
