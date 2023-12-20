<script lang="ts">
  import type { PageData } from '../$types';

  import { page } from '$app/stores';
  import {
    CrownIcon,
    DeleteIcon,
    PencilIcon,
    ReceiptIcon,
    Users2Icon,
  } from 'lucide-svelte';
  import { fly, slide } from 'svelte/transition';
  import Modal from '$lib/components/modal/modal.svelte';

  export let household: PageData['households'][number];
  export let userMap: PageData['streamable']['userHouseholds'];
  export let generateLinkUri: (p: PageData['households'][number]) => string = (
    p,
  ) => `/dashboard/household/${p.id}`;
  export let selected = false;
</script>

<a
  in:fly={{ y: 20 }}
  out:slide
  data-sveltekit-preload-data="tap"
  href={generateLinkUri(household)}
  class="flex flex-col gap-2 bg-primary-active-token rounded p-3 hover:bg-primary-hover-token"
  class:bg-primary-active-token={selected}
>
  <header class="flex gap-2 items-baseline text-lg justify-between">
    <div class="flex gap-2 items-baseline">
      {#if $page.data.user.id === household.ownerId}
        <CrownIcon size="0.9em" />
      {/if}
      {household.name}
    </div>
  </header>

  <section class="flex gap-2 items-center">
    {#await userMap}
      <div class="placeholder" />
    {:then d}
      {#if d[household.id]}
        <Users2Icon size="0.9em" />
        {d[household.id].users.length} member(s)
      {/if}
    {/await}
  </section>
  <section class="flex gap-2 items-center">
    <ReceiptIcon size="1em" />
    {household.billCount} bill(s)
  </section>
</a>
