<script lang="ts">
  import { page } from '$app/stores';
</script>
<nav>
  I am the header
  {#if $page.data.user && $page.data.user.id !== undefined}
    <a href="/logout">Logout</a>
  {:else}
    <a href="/login">Login</a>
  {/if}
</nav>