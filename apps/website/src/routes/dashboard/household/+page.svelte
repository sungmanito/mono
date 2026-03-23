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
  import {
    getUserHouseholdsWithBillCount,
    getUserHouseholdsWithMembers,
    getUserBillsByHousehold,
  } from '$lib/remotes/households.remote';

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

<svelte:boundary>
  {#snippet pending()}
    <div class="container mx-auto mt-4 px-6">
      <div class="h-8 w-48 rounded animate-pulse bg-surface-300 mb-6"></div>
      {#each Array(3) as _}
        <div class="h-32 rounded animate-pulse bg-surface-300 mb-4"></div>
      {/each}
    </div>
  {/snippet}

  {@const households = await getUserHouseholdsWithBillCount()}
  {@const userMap = getUserHouseholdsWithMembers()}
  {@const billsMap = await getUserBillsByHousehold()}
  {@const totalBills = Object.values(billsMap).reduce((all, cur) => all + cur.length, 0)}
  {@const upcoming = Object.values(billsMap).reduce((all, cur) => {
    const today = new Date().setHours(0, 0, 0, 0);
    for (const bill of cur) {
      if (new Date(bill.dueDate).getTime() > today) all += 1;
    }
    return all;
  }, 0)}

  <div class="container mx-auto mt-4 px-6">
    <Breadcrumb
      class="mb-4"
      crumbs={[
        { link: 'Dashboard', href: '/dashboard' },
        { link: 'Households', href: '/dashboard/household' },
      ]}
    />

    <Header class="mb-4">
      Households
      {#snippet actions()}
        <Button size="sm" variant="primary" onclick={() => (showCreateHousehold = true)}>Add household</Button>
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
            {totalBills}
          </div>
        </div>
        <div class="card md:w-1/3">
          <div class="card-header">
            <Header tag="h4" color="secondary">
              <div class="inline-flex gap-3 items-center">Upcoming Bills</div>
            </Header>
          </div>
          <div class="p-4 font-bold text-2xl">
            {upcoming}
          </div>
        </div>
      </div>
      {#each households as household (household.id)}
        <Expandable
          class="card max-h-96 overflow-auto"
          headerContainerClasses={['card-header pb-2']}
          disableExpandButton
        >
          {#snippet header({ open, toggle })}
            <div class="flex flex-col gap-4">
              <Header tag="h5" color="secondary">
                <button type="button" onclick={() => toggle()} role="switch" aria-checked={open}>
                  <strong>{household.name}</strong>
                </button>
                {#snippet actions()}
                  <a href={`/dashboard/household/${household.id}`} class="btn-sm variant-outline">
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
                  {#await userMap}
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
                <div>{billsMap[household.id]?.length ?? 0}</div>
              </div>
            </div>
          {/snippet}
          <div class="p-4 flex flex-col gap-4">
            <hr />
            <Header tag="h6" color="secondary">
              <strong>Members</strong>
            </Header>
            {#await userMap}
              Loading
            {:then userHouseholds}
              {#if userHouseholds[household.id]?.users}
                {#each userHouseholds[household.id].users as member}
                  <div class="kv">
                    <div>Name</div>
                    <div>{(member.userMetadata as any)?.name || member.email}</div>
                  </div>
                {/each}
              {/if}
            {/await}

            <Header tag="h6" color="secondary">
              <strong>Bills</strong>
            </Header>
            {#if billsMap[household.id]}
              {#each billsMap[household.id] as bill (bill.id)}
                <div class="kv">
                  <div>{bill.billName}</div>
                  <div>
                    {#if bill.amount}
                      {formatNumber(Number(bill.amount), bill.currency)}
                    {/if}
                  </div>
                </div>
              {/each}
            {/if}
          </div>
        </Expandable>
      {/each}
    </section>
  </div>
</svelte:boundary>

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
