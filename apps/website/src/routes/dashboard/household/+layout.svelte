<script lang="ts">
  import HouseholdSidebar from './_components/householdSidebar.svelte';
  let { children } = $props();
</script>

<HouseholdSidebar />

{@render children?.()}
