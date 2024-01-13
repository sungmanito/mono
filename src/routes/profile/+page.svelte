<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import Header from '$lib/components/header/header.svelte';
  import { XIcon } from 'lucide-svelte';
  import type { User } from '@supabase/supabase-js';
  import Identity from './_components/identities/identity.svelte';
  import Button from '$lib/components/button/button.svelte';
  import Drawer from '$lib/components/drawer/drawer.svelte';
  import { enhance } from '$app/forms';
  import FormLabel from '$lib/components/formLabel/formLabel.svelte';

  export let data;

  $: if (!$page.data.user.id) {
    goto('/login', { replaceState: true });
  }

  function usernameOrEmail(user: User) {
    if (user.user_metadata.name) return user.user_metadata.name;
    return user.email;
  }

  let editProfile = false;
  let profileSaving = false;
</script>

<svelte:head>
  <title>Sungmanito &ndash; User Profile</title>
</svelte:head>

<Drawer
  open={editProfile}
  on:close={() => (editProfile = false)}
  let:close={closeEditDrawer}
>
  <form
    action="?/updateProfile"
    class="p-4"
    method="post"
    use:enhance={() => {
      profileSaving = true;
      return async () => {
        profileSaving = false;
        closeEditDrawer();
        await invalidateAll();
      };
    }}
  >
    <Header color="secondary" tag="h2" class="mb-10">
      Edit Profile
      <svelte:fragment slot="actions">
        <button class="btn-icon btn-icon-sm" on:click={() => closeEditDrawer()}>
          <XIcon size="1.5em" />
        </button>
      </svelte:fragment>
    </Header>
    <div class="grid grid-cols-3 gap-2">
      <div class="flex gap-2">
        {#if data.user && data.user.user_metadata?.avatar_url}
          <img
            src={data.user.user_metadata.avatar_url}
            class="rounded-full max-w-[100px]"
            alt="Profile"
          />
        {/if}
        <label class="flex flex-col gap-2 flex-grow">
          <span class="font-semibold"> Avatar URL </span>
          <input
            disabled={profileSaving}
            type="url"
            class="input"
            name="avatar-url"
            value={data?.user?.user_metadata?.avatar_url || ''}
            placeholder="https://images.website.com/your-profile.png"
          />
        </label>
      </div>
      <div>
        <label class="flex flex-col gap-2">
          <span class="font-semibold"> Name </span>
          <input
            disabled={profileSaving}
            type="text"
            class="input"
            name="name"
            value={data.user?.user_metadata?.name || ''}
            placeholder="Name others will see"
          />
        </label>
      </div>
      <div>
        <label class="flex flex-col gap-2">
          <span class="font-semibold"> Email </span>
          <input
            disabled={profileSaving}
            type="email"
            name="email"
            class="input"
            value={data.user?.email}
          />
        </label>
      </div>
      <div>
        <FormLabel label="Password" description="Please use a secure password complete with numbers, upper and lower case characters, and at least one special symbol">
          <input class="input" type="password" placeholder="New Password" name="password">
        </FormLabel>
      </div>
    </div>
    <footer class="mt-8 flex justify-end gap-3">
      <Button
        variant="filled"
        on:click={() => closeEditDrawer()}
        disabled={profileSaving}
      >
        Close
      </Button>
      <Button disabled={profileSaving}>Save</Button>
    </footer>
  </form>
</Drawer>

<section class="flex-grow">
  <div class="container mx-auto">
    <Header class="mt-4">
      Profile
      <svelte:fragment slot="actions">
        <Button on:click={() => (editProfile = true)}>Edit profile</Button>
      </svelte:fragment>
    </Header>
    {#if data.user}
      <div class="grid grid-cols-12 gap-3">
        {#if data.user.user_metadata?.avatar_url}
          <div class="col-span-1">
            <img
              src={data.user.user_metadata.avatar_url}
              class="rounded-full max-w-[90px]"
              alt="profile for"
            />
          </div>
        {/if}

        <div class="flex flex-col gap-2 text-lg text-zinc-400 col-span-2">
          <span class="font-bold">ID</span>
          <span class="text-sm">{data.user.id}</span>
        </div>

        <div class="flex flex-col gap-2 text-lg col-span-2">
          <div class="font-bold">User name</div>
          <span>
            {usernameOrEmail(data.user)}
          </span>
        </div>

        <div class="flex flex-col gap-2 text-lg col-span-2">
          <div class="font-bold">Email</div>
          <span>
            {data.user.email}
          </span>
        </div>

        <div class="col-start-1 col-span-12 border-t p-3 flex flex-col gap-3">
          <Header tag="h2" color="secondary">Identities</Header>

          <p class="text-lg dark:text-zinc-400 text-zinc-500">
            Currently read-only. Full identity management coming soon
          </p>

          {#if data.user.identities}
            {#each data.user.identities as identity}
              <Identity {identity} />
            {/each}
          {/if}
        </div>
      </div>
    {:else}
      <a href="/login">Go to login</a>
    {/if}
  </div>
</section>
