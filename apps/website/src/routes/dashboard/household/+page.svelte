<script lang="ts">
  import Breadcrumb from '$lib/components/breadcrumb/breadcrumb.svelte';
  import Button from '$lib/components/button/button.svelte';
  import Header from '$lib/components/header/header.svelte';
  import CreateHouseholdComponent from './create/+page.svelte';
  import Drawerify from '$components/drawerify/drawerify.svelte';
  import { pushState } from '$app/navigation';
  let showCreateHousehold = $state(false);
  const createHouseholdUrl = '/dashboard/household/create';
</script>

<svelte:head>
  <title>Dashboard &ndash; Households</title>
</svelte:head>

<Drawerify
  open={showCreateHousehold}
  url={createHouseholdUrl}
  onopen={() => pushState(createHouseholdUrl, {})}
  onclose={() => pushState('/dashboard/household', {})}
  component={CreateHouseholdComponent}
/>

<div class="container mx-auto mt-4 px-6">
  <Breadcrumb
    class="mb-4"
    crumbs={[
      {
        link: 'Dashboard',
        href: '/dashboard',
      },
      {
        link: 'Households',
        href: '/dashboard/household',
      },
    ]}
  />

  <Header class="mb-4">
    Households
    {#snippet actions()}
      <Button
        size="sm"
        variant="primary"
        onclick={() => (showCreateHousehold = true)}>Add</Button
      >
    {/snippet}
  </Header>

  <section class="flex flex-col gap-4">
    <p>
      Please select a household from the list to the left to view more details.
    </p>
  </section>
</div>
