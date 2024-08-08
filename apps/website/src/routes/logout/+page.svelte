<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { queryClient } from '$lib/client/svelte-query';
  import { onMount } from 'svelte';

  onMount(async () => {
    queryClient.clear();
    invalidateAll();
    await goto('/');
  });
</script>

<h1>Logging out...</h1>
