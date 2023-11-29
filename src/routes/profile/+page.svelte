<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import Header from '$lib/components/header/header.svelte';
  import { MailIcon } from 'lucide-svelte';
  import type { User } from '@supabase/supabase-js';
  import GoogleIcon from '$lib/components/googleIcon.svelte';
  export let data;

  $: if(!$page.data.user.id) {
    goto('/login', { replaceState: true });
  }

  function usernameOrEmail(user: User) {
    if(user.user_metadata.name) return user.user_metadata.name;
    return user.email;
  }
</script>
<section class="flex-grow">
  <div class="container mx-auto">
    <Header class="mt-4">
      Profile
    </Header>
    {#if data.user}
    <div class="grid grid-cols-12 gap-3">
      <div class="col-span-12">
        {#if data.user.user_metadata?.avatar_url}
          <img src={data.user.user_metadata.avatar_url} class="rounded-full" alt="Profile image"/>
        {/if}
      </div>

      <div class="flex gap-2 text-lg text-zinc-400 col-span-2">
        <span class="font-bold">ID</span>
        <span>{data.user.id}</span>
      </div>
      
      <div class="flex gap-2 text-lg col-span-2">
        <div class="font-bold">
          User name
        </div>
        <span>
          {usernameOrEmail(data.user)}
        </span>
      </div>

      <div class="flex gap-2 text-lg col-span-2">
        <div class="font-bold">
          Email
        </div>
        <span>
          {data.user.email}
        </span>
      </div>

      <div class="col-start-1 col-span-12 border-t p-3">
        <Header tag="h2" color="secondary">
          Identities
        </Header>

        {#if data.user.identities}
          {#each data.user.identities as identity}
            <div class="flex gap-3 variant-filled-surface rounded p-4">
              {#if identity.provider === 'google'}
                <GoogleIcon class="w-8 h-8" />
              {:else if identity.provider === 'email'}
                <MailIcon class="w-8 h-8"/>
              {/if}
              <div>
                <div>
                  Identity ID: {identity.id}
                </div>
                {#if identity.identity_data?.full_name}
                <div>
                  Full Name: {identity.identity_data?.full_name}
                </div>
                {/if}
                {#if identity.identity_data?.avatar_url}
                <div>
                  Image
                  <img src={identity.identity_data.avatar_url} class="rounded" alt={`${identity.provider} avatar`}/>
                </div>
                {/if}
                <div>
                  Last sign in:
                  {identity.last_sign_in_at}
                </div>
              </div>
            </div>

            {JSON.stringify(identity)}
          {/each}
        {/if}
      </div>
    </div>
    {:else}
      <a href="/login">Go to login</a>
    {/if}
  </div>
</section>