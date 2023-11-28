<script lang="ts">
  import { enhance } from '$app/forms';
  import Breadcrumb from "$lib/components/breadcrumb/breadcrumb.svelte";
  import Button from "$lib/components/button/button.svelte";
  import Header from "$lib/components/header/header.svelte";
  import { CheckIcon, PlusIcon, XIcon } from "lucide-svelte";
  import HouseholdSideItem from "./_components/householdSideItem.svelte";
    import HouseholdSidebar from './_components/householdSidebar.svelte';
  export let data;

  let households = data.households;
  $: households = data.households;

  function toggleHouseholds() {
    const el = document.getElementById('create-household');
    if(!(el instanceof HTMLDialogElement)) {
      return false;
    }
    if(el.hasAttribute('open')) {
      el.close()
    } else {
      el.showModal();
    }
  }
</script>

<svelte:head>
  <title>Dashboard &ndash; Households</title>
</svelte:head>

<HouseholdSidebar
  households={households}
  userMap={data.streamable.userHouseholds}
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
        href: '/dashboard/household'
      }
    ]}
  />
  <Header class="mb-4">
    Households
    <svelte:fragment slot="actions">
      <Button size="sm" variant="primary" on:click={toggleHouseholds}>Add</Button>
    </svelte:fragment>
  </Header>

  <section class="flex flex-col gap-4">
    <p>Please select a household from the list to the left to view more details.</p>
  </section>

  <section>
    <Header tag="h2" color="secondary" class="my-6">
      Invites
    </Header>

    {#await data.streamed.invites}
      <div class="placeholder mt-4 w-32"></div>
      <div class="placeholder mt-4 w-32"></div>
      <div class="placeholder mt-4 w-32"></div>
    {:then invites}
      {#each invites as invite (invite.invites.id)}
        <form use:enhance action="?/updateInvite" method="post">
          <input type="hidden" name="invite-id" value={invite.invites.id}>
          <div class="flex gap-2 items-center">
            <section>
              <strong>{invite.households.name}</strong> by {invite.invites.fromEmail}
            </section>
            <button name="action" value="accept" class="btn-icon btn-icon-sm variant-outline-primary">
              <CheckIcon size="1em"/>
            </button>
            <button name="action" value="delete" class="btn-icon btn-icon-sm variant-outline-error">
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
    <button on:click={e => {
      e.currentTarget.closest('dialog')?.close();
    }}>
      <XIcon size="0.8rem" />
    </button>
  </header>
  <form action="?/addHousehold" method="post" use:enhance>
    <label>
      <input name="household-name" type="text" class="p-2 border rounded" placeholder="New Household name">
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