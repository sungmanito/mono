<script lang="ts">
  import { enhance } from '$app/forms';
  import Breadcrumb from '$lib/components/breadcrumb/breadcrumb.svelte';
  import Button from '$lib/components/button/button.svelte';
  import Header from '$lib/components/header/header.svelte';
  import CreateHouseholdComponent from './create/+page.svelte';
  import Drawerify from '$components/drawerify/drawerify.svelte';
  import { CheckIcon, XIcon } from 'lucide-svelte';
  import { pushState } from '$app/navigation';
  let { data } = $props();
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

  <section>
    <Header tag="h2" color="secondary" class="my-6">Invites</Header>

    {#await data.streamed.invites}
      <div class="placeholder mt-4 w-32"></div>
      <div class="placeholder mt-4 w-32"></div>
      <div class="placeholder mt-4 w-32"></div>
    {:then invites}
      {#each invites as invite (invite.invites.id)}
        <form use:enhance action="?/updateInvite" method="post">
          <input type="hidden" name="invite-id" value={invite.invites.id} />
          <div class="flex gap-2 items-center">
            <section>
              <strong>{invite.households.name}</strong> by {invite.invites
                .fromEmail}
            </section>
            <button
              name="action"
              value="accept"
              class="btn-icon btn-icon-sm variant-outline-primary"
            >
              <CheckIcon size="1em" />
            </button>
            <button
              name="action"
              value="delete"
              class="btn-icon btn-icon-sm variant-outline-error"
            >
              <XIcon size="1em" />
            </button>
          </div>
        </form>
      {:else}
        <em>You have no outstanding invites</em>
      {/each}
    {/await}
  </section>
</div>
