<script lang="ts">
  import { pushState } from '$app/navigation';
  import Drawerify from '$components/drawerify/drawerify.svelte';
  import Breadcrumb from '$lib/components/breadcrumb/breadcrumb.svelte';
  import Button from '$lib/components/button/button.svelte';
  import Header from '$lib/components/header/header.svelte';
  import { ReceiptIcon, ChevronDownIcon } from 'lucide-svelte';
  import CreateHouseholdComponent from './create/+page.svelte';
  import Expandable from '$lib/components/expandable/expandable.svelte';
  import { formatNumber } from '$lib/util/numbers';
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
        onclick={() => (showCreateHousehold = true)}>Add household</Button
      >
    {/snippet}
  </Header>

  <section class="flex flex-col gap-4 pb-4">
    <div class="flex flex-col gap-4 md:justify-center md:flex-row">
      <div class="card md:w-1/3">
        <div class="card-header">
          <Header tag="h4" color="secondary">
            <div class="inline-flex gap-3 items-center">
              <ReceiptIcon size="1.1em" />
              Total Bills
            </div>
          </Header>
        </div>
        <div class="p-4 font-bold text-2xl">
          {#await data.bills}
            <div class="placeholder"></div>
          {:then bills}
            {@const totalBills = Object.keys(bills).reduce((all, cur) => {
              return all + bills[cur].length;
            }, 0)}
            {totalBills}
          {/await}
        </div>
      </div>
      <div class="card md:w-1/3">
        <div class="card-header">
          <Header tag="h4" color="secondary">
            <div class="inline-flex gap-3 items-center">Upcoming Bills</div>
          </Header>
        </div>
        <div class="p-4 font-bold text-2xl">
          {#await data.bills}
            <div class="placeholder"></div>
          {:then bills}
            {@const upcoming = Object.values(bills).reduce((all, cur) => {
              const today = new Date().setHours(0, 0, 0, 0);
              for (const bill of cur) {
                if (new Date(bill.dueDate).getTime() > today) all += 1;
              }
              return all;
            }, 0)}
            {upcoming}
          {/await}
        </div>
      </div>
    </div>
    {#each data.households as household (household.id)}
      <Expandable
        class="card max-h-96 overflow-auto"
        headerContainerClasses={['card-header pb-2']}
        disableExpandButton
      >
        {#snippet header({ open, toggle })}
          <div class="flex flex-col gap-4">
            <Header tag="h5" color="secondary">
              <strong>{household.name}</strong>
              {#snippet actions()}
                <a href={`/dashboard/household/${household.id}`} class="btn-sm">
                  Go to details
                </a>
                <Button variant="custom" class="pb-2" onclick={toggle}>
                  <ChevronDownIcon class={open ? 'rotate-180' : undefined} />
                </Button>
              {/snippet}
            </Header>
            <div class="kv bold">
              <div>Members</div>
              <div>
                {#await data.streamable.userHouseholds}
                  <div class="placeholder h-4 w-2"></div>
                {:then users}
                  {#if users[household.id]}
                    {users[household.id].users.length}
                  {:else}
                    1
                  {/if}
                {/await}
              </div>
            </div>
            <div class="kv bold">
              <div>Bills</div>
              <div>
                {#await data.bills}
                  <div class="placeholder"></div>
                {:then billsMap}
                  {billsMap[household.id]?.length ?? 0}
                {/await}
              </div>
            </div>
          </div>
        {/snippet}
        <div class="p-4 flex flex-col gap-4">
          <hr />
          <Header tag="h6" color="secondary">
            <strong>Members</strong>
          </Header>
          {#await data.streamable.userHouseholds}
            Loading
          {:then userHouseholds}
            {#if userHouseholds[household.id].users}
              {#each userHouseholds[household.id].users as member}
                <div class="kv">
                  <div>
                    {member.userMetadata?.name || member.email}
                  </div>
                  <div></div>
                </div>
              {/each}
            {/if}
          {/await}

          <Header tag="h6" color="secondary">
            <strong>Bills</strong>
          </Header>
          {#await data.bills}
            <div class="placeholder animate-pusle"></div>
          {:then billsMap}
            {#if billsMap[household.id]}
              {#each billsMap[household.id] as bill (bill.id)}
                <div class="kv">
                  <div>
                    {bill.billName}
                  </div>
                  <div>
                    {#if bill.amount}
                      {formatNumber(Number(bill.amount), bill.currency)}
                    {/if}
                  </div>
                </div>
              {/each}
            {/if}
          {/await}
        </div>
      </Expandable>
    {/each}
  </section>
</div>

<style>
  .kv {
    display: flex;
    justify-content: space-between;
    &.bold {
      > :first-child {
        font-weight: 600;
        color: theme('colors.zinc.300');
      }
    }
  }
</style>
