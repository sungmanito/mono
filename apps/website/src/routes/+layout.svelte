<script lang="ts">
  import Navbar from '$lib/components/navbar.svelte';
  import { Toast, initializeStores } from '@skeletonlabs/skeleton';
  import posthog from 'posthog-js';
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import '../app.css';

  initializeStores();

  let { data, children } = $props();

  onMount(() => {
    if (browser) {
      posthog.init('phc_HaLqMjTX6V0XcDNz0w1fpHvdXDg2y0I7BdhkKLsE6Ai', {
        api_host: 'https://us.i.posthog.com',
        person_profiles: 'always', // or 'always' to create profiles for anonymous users as well
      });
      if (data.user) {
        posthog.identify(data.user.email);
      }
    }
  });
</script>

<Toast position="t" />

<div class="min-h-screen flex flex-col">
  <Navbar />
  {@render children?.()}
  <footer class="p-4 bg-surface-50-900-token flex justify-center">
    &copy; Sungmanito
  </footer>
</div>
