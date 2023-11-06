<script lang="ts">
  import Navbar from '$lib/components/navbar.svelte';
    import { Toast, initializeStores } from '@skeletonlabs/skeleton';
  import '../app.css';

  initializeStores();

</script>

<Toast position="t" />

<div class="min-h-screen flex flex-col">
  <Navbar />
  <slot />
  <footer class="bg-zinc-900">I am the footer here</footer>
</div>
