<script lang="ts">
  import Button from "$lib/components/button/button.svelte";
  import { enhance } from '$app/forms';
  import Header from "$lib/components/header/header.svelte";
  import type { PageData } from './$types';
  import HouseholdListItem from "./_components/householdListItem.svelte";
  export let data: PageData;
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

<div class="container mx-auto mt-4">
  <Header>
    Households
    <svelte:fragment slot="actions">
      <Button on:click={toggleHouseholds}>Add</Button>
    </svelte:fragment>
  </Header>

  {#each households as household}
    <HouseholdListItem  household={household}/>
  {/each}
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