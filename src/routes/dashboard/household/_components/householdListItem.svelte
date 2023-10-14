<script lang="ts">
  import type { PageData } from '../$types';
  import { enhance } from '$app/forms';
  import { fly, slide } from 'svelte/transition';
  import Button from '$lib/components/button/button.svelte';
  export let household: PageData['households'][number];
  let editing = false;
  let saving = false;
  let action = '?/deleteHousehold';
  $: action = editing ? '?/updateHousehold' : '?/deleteHousehold';

  const handleInput = (e: KeyboardEvent & { currentTarget: HTMLInputElement }) => {
    e.preventDefault();
    if(e.key === 'Enter') e.currentTarget.form?.submit();
  }
</script>

<div class="p-2 border rounded my-2" in:fly={{ y: 20}} out:slide>
  <form action={action} method="post" use:enhance={() => {
    saving = true;
    return async ({
      result, update, formData 
    }) => {
      await update();
      console.info(result, update, formData);
      editing = false;
      saving = false;
    }
  }}>
    <input type="hidden" value={household.id} name="household-id"/>
    <header class="flex gap-4 items-center">
      {#if saving}
        Loading...
      {/if}
      {#if editing}
        <input type="text" class="text-gray-800 p-1 rounded" placeholder="Testing" name="household-name" value={household.name} on:keydown={e => {}} />
      {:else}
        <a title={`View more information about ${household.name} Household`} class="font-bold" href={`/dashboard/household/${household.id}`}>{household.name}</a>
      {/if}
      <small class="text-slate-400">
        {household.id}
      </small>
      <span>
        &ndash; {household.users.length} members
      </span>
    </header>
    <Button type="submit">Delete</Button>
    <Button type="button" on:click={() => editing = !editing}>
      {#if editing} 
        Save
      {:else}
        Edit
      {/if}
    </Button>
  </form>
</div>