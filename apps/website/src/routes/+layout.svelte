<script lang="ts">
  interface Props { children?: import('svelte').Snippet }

  let { children }: Props = $props();
  import Navbar from '$lib/components/navbar.svelte';
  import { Toast, initializeStores } from '@skeletonlabs/skeleton';
  import '../app.css';

  initializeStores();
</script>

<Toast position="t" />

<div class="min-h-screen flex flex-col">
  <Navbar />
  {@render children?.()}
  <footer class="p-4 bg-surface-50-900-token flex justify-center">
    &copy; Sungmanito
  </footer>
</div>
