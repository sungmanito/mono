<script lang="ts">
  import { enhance } from '$app/forms';
  import Breadcrumb from "$lib/components/breadcrumb/breadcrumb.svelte";
  import Button from "$lib/components/button/button.svelte";
  import Header from "$lib/components/header/header.svelte";
  import { PlusIcon } from "lucide-svelte";
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
  userMap={data.streamed.userHouseholds}
  on:click={toggleHouseholds}
/>

<!-- <section class="w-[15%] min-w-max bg-surface-50-900-token p-4">
  <div class="flex flex-col gap-2">
    <header class="flex justify-between gap-4">
      
      <h3 class="h3">
        Households
      </h3>
      <section class="actions">
        <Button variant="primary" class="inline-flex gap-2 items-center" on:click={toggleHouseholds}>
          <PlusIcon size="1em" />
          Add
        </Button>
      </section>
    </header>

    {#each households as household }     
      <HouseholdSideItem household={household} userMap={data.streamed.userHouseholds} />
    {/each}
  </div>
</section>
-->

<div class="container mx-auto mt-4">
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
    <p>Please select a household from the list to the left</p>
  </section>

</div>

<dialog id="create-household" class="rounded-lg p-2 max-w-[30vw]">
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