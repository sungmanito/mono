<script lang="ts">
  import HouseholdSidebar from './_components/householdSidebar.svelte';
  let { data, children } = $props();
</script>

<HouseholdSidebar
  households={data.households}
  userMap={data.streamable.userHouseholds}
  invites={data.invites}
/>

{@render children?.()}
