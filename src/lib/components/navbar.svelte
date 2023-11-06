<script lang="ts">
  import { page } from '$app/stores';
  import { AppBar, LightSwitch } from '@skeletonlabs/skeleton';
</script>
<AppBar shadow="shadow">
	<svelte:fragment slot="lead">
    Sungmanito
  </svelte:fragment>
	<svelte:fragment slot="trail">
    <LightSwitch />
    {#if $page.data.user && $page.data.user.id !== undefined}
      <a class="btn btn-sm variant-filled" href="/logout">Logout</a>
      <a class="btn btn-sm variant-ghost-primary" href="/dashboard">Dashboard</a>
    {:else}
      <a class="btn btn-sm variant-filled" href="/login">Login</a>
    {/if}
  </svelte:fragment>
</AppBar>
