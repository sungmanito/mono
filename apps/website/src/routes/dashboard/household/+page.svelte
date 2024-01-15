<script lang="ts">
  import { enhance } from '$app/forms';
  import Breadcrumb from '$lib/components/breadcrumb/breadcrumb.svelte';
  import Button from '$lib/components/button/button.svelte';
  import Header from '$lib/components/header/header.svelte';
  import { CheckIcon, XIcon } from 'lucide-svelte';
  import HouseholdSidebar from './_components/householdSidebar.svelte';
  import CreateHousehold from '$lib/components/households/create.svelte';
  import { invalidateAll } from '$app/navigation';
  export let data;

  let households = data.households;
  $: households = data.households;

  function toggleHouseholds() {
    const el = document.getElementById('create-household');
    if (!(el instanceof HTMLDialogElement)) {
      return false;
    }
    if (el.hasAttribute('open')) {
      el.close();
    } else {
      el.showModal();
    }
  }

  let addHousehold = false;
</script>

<svelte:head>
  <title>Dashboard &ndash; Households</title>
</svelte:head>

<HouseholdSidebar {households} userMap={data.streamable.userHouseholds} />

<CreateHousehold
  open={addHousehold}
  on:close={() => (addHousehold = false)}
  submit={({ formData }) => {
    const members = formData.get('members') || '';
    if (members && typeof members === 'string') {
      console.info('what', members);
      formData.delete('members');
      for (const member of members.split(/\r?\n|,|\s+/)) {
        formData.append('members', member.trim());
      }
    }
    return async ({ formElement, update }) => {
      await update();
      await invalidateAll();
      formElement.reset();
    };
  }}
/>

<div class="container mx-auto mt-4 px-6">
  <Breadcrumb
    class="mb-4"
    crumbs={[
      {
        link: 'Dashboard',
        href: '/dashboard',
      },
      {
        link: 'Households',
        href: '/dashboard/household',
      },
    ]}
  />
  <Header class="mb-4">
    Households
    <svelte:fragment slot="actions">
      <Button size="sm" variant="primary" on:click={() => (addHousehold = true)}
        >Add</Button
      >
    </svelte:fragment>
  </Header>

  <section class="flex flex-col gap-4">
    <p>
      Please select a household from the list to the left to view more details.
    </p>
  </section>

  <section>
    <Header tag="h2" color="secondary" class="my-6">Invites</Header>

    {#await data.streamed.invites}
      <div class="placeholder mt-4 w-32"></div>
      <div class="placeholder mt-4 w-32"></div>
      <div class="placeholder mt-4 w-32"></div>
    {:then invites}
      {#each invites as invite (invite.invites.id)}
        <form use:enhance action="?/updateInvite" method="post">
          <input type="hidden" name="invite-id" value={invite.invites.id} />
          <div class="flex gap-2 items-center">
            <section>
              <strong>{invite.households.name}</strong> by {invite.invites
                .fromEmail}
            </section>
            <button
              name="action"
              value="accept"
              class="btn-icon btn-icon-sm variant-outline-primary"
            >
              <CheckIcon size="1em" />
            </button>
            <button
              name="action"
              value="delete"
              class="btn-icon btn-icon-sm variant-outline-error"
            >
              <XIcon size="1em" />
            </button>
          </div>
        </form>
      {:else}
        <em>You have no outstanding invites</em>
      {/each}
    {/await}
  </section>
</div>

<dialog id="create-household" class="rounded-lg p-2 max-w-[30vw]">
  <header class="flex flex-end">
    <button
      on:click={(e) => {
        e.currentTarget.closest('dialog')?.close();
      }}
    >
      <XIcon size="0.8rem" />
    </button>
  </header>
  <form action="?/addHousehold" method="post" use:enhance>
    <label>
      <input
        name="household-name"
        type="text"
        class="p-2 border rounded"
        placeholder="New Household name"
      />
    </label>
    <footer class="p-4 flex justify-end">
      <Button on:click={toggleHouseholds} class="bob">Add</Button>
    </footer>
  </form>
</dialog>

<style>
  dialog::backdrop {
    background-color: rgb(from theme('colors.zinc.800') / 40);
  }
</style>
