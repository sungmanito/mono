<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import Header from '$lib/components/header/header.svelte';
  import { MailIcon } from 'lucide-svelte';
  import type { User } from '@supabase/supabase-js';
  import GoogleIcon from '$lib/components/googleIcon.svelte';
  import Identity from './_components/identities/identity.svelte';
  import { Accordion, AccordionItem } from '@skeletonlabs/skeleton';
  import Button from '$lib/components/button/button.svelte';

  export let data;

  $: if(!$page.data.user.id) {
    goto('/login', { replaceState: true });
  }

  function usernameOrEmail(user: User) {
    if(user.user_metadata.name) return user.user_metadata.name;
    return user.email;
  }

  let editProfile = false;
</script>

<svelte:head>
  <title>
    Sungmanito &ndash; User Profile
  </title>
</svelte:head>

<Drawer open={editProfile} on:clo>
  <Header color="secondary" tag="h2">
    Edit Profile
  </Header>
</Drawer>

<section class="flex-grow">
  <div class="container mx-auto">
    <Header class="mt-4">
      Profile
      <svelte:fragment slot="actions">
        <Button on:click={() => editProfile = true}>

        </Button>
      </svelte:fragment>
    </Header>
    {#if data.user}
    <div class="grid grid-cols-12 gap-3">
      <div class="col-span-1">
        {#if data.user.user_metadata?.avatar_url}
          <img src={data.user.user_metadata.avatar_url} class="rounded-full" alt="profile for"/>
        {/if}
      </div>

      <div class="flex flex-col gap-2 text-lg text-zinc-400 col-span-2">
        <span class="font-bold">ID</span>
        <span class="text-sm">{data.user.id}</span>
      </div>
      
      <div class="flex flex-col gap-2 text-lg col-span-2">
        <div class="font-bold">
          User name
        </div>
        <span>
          {usernameOrEmail(data.user)}
        </span>
      </div>

      <div class="flex flex-col gap-2 text-lg col-span-2">
        <div class="font-bold">
          Email
        </div>
        <span>
          {data.user.email}
        </span>
      </div>

      <div class="col-start-1 col-span-12 border-t p-3 flex flex-col gap-3">
        <Header tag="h2" color="secondary">
          Identities
        </Header>

        {#if data.user.identities}
          {#each data.user.identities as identity}
            <Identity identity={identity}/>
          {/each}
        {/if}
      </div>
    </div>
    {:else}
      <a href="/login">Go to login</a>
    {/if}
  </div>
</section>