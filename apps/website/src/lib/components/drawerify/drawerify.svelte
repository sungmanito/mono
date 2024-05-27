<script lang="ts" generics="T">
  import { preloadData } from '$app/navigation';
  import Drawer from '$lib/components/drawer/drawer.svelte';
  export let route: string;
  export let open = false;
  export let onclose: () => void = () => void 0;
</script>

<Drawer open on:close={onclose} let:close={drawerClose}>
  <slot component={true} />
</Drawer>
