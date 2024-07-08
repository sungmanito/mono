<script lang="ts">
  import HouseholdSidebar from './_components/householdSidebar.svelte';
  export let data;
</script>

<HouseholdSidebar
  households={data.households}
  userMap={data.streamable.userHouseholds}
/>

<slot />
