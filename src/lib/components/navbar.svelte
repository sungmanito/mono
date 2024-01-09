<script lang="ts">
  import { page } from '$app/stores';
  import { AppBar, LightSwitch } from '@skeletonlabs/skeleton';
  import { LayoutDashboardIcon, User2Icon } from 'lucide-svelte';
</script>

<AppBar shadow="shadow">
  <svelte:fragment slot="lead">
    <div class="flex gap-2">
      <img
        src="/sungmanito-color.svg"
        alt="Sungmanito Logo of a wolf"
        class="h-[1.75em]"
      />
      Sungmanito
    </div>
  </svelte:fragment>
  <svelte:fragment slot="trail">
    <LightSwitch />
    {#if $page.data.user && $page.data.user.id !== undefined}
      <a class="btn btn-sm variant-filled flex gap-1" href="/logout">
        <User2Icon size="1em" />
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
