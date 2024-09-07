<script lang="ts">
  import { page } from '$app/stores';
  import { AppBar, LightSwitch } from '@skeletonlabs/skeleton';
  import {
    LayoutDashboardIcon,
    User2Icon,
    LogOutIcon,
    MenuIcon,
  } from 'lucide-svelte';
</script>

<AppBar shadow="shadow">
  <svelte:fragment slot="lead">
    <div class="flex gap-2">
      <button
        class="md:hidden"
        aria-label="Open Sidebar"
        popovertarget="side-menu"
      >
        <MenuIcon size="1.75em" />
      </button>
      <img
        src="/sungmanito-color.svg"
        alt="Sungmanito Logo of a wolf"
        class="h-[1.75em]"
      />
      <span class="hidden md:block">Sungmanito</span>
    </div>
  </svelte:fragment>
  <svelte:fragment slot="trail">
    <LightSwitch />
    <!-- This would be a good thing to move into a snippet -->
    {#if $page.data.user && $page.data.user.id !== undefined}
      <a href="/profile" class="btn-icon btn-icon-sm">
        <User2Icon size="1em" />
        <div class="sr-only">User Profile</div>
      </a>
      <a class="btn btn-sm variant-filled flex gap-1" href="/logout">
        <LogOutIcon size="1em" />
        Logout
      </a>
      <a class="btn btn-sm variant-ghost-primary flex gap-1" href="/dashboard">
        <LayoutDashboardIcon size="1em" />
        Dashboard
      </a>
    {:else}
      <a class="btn btn-sm variant-filled" href="/login">Login</a>
    {/if}
  </svelte:fragment>
</AppBar>
