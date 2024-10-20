<script lang="ts">
  import HouseholdSidebar from './_components/householdSidebar.svelte';
  interface Props { data: any, children?: import('svelte').Snippet }

  let { data, children }: Props = $props();
</script>

<HouseholdSidebar
  households={data.households}
  userMap={data.streamable.userHouseholds}
/>

{@render children?.()}
