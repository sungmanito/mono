<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto, pushState } from '$app/navigation';
  import Breadcrumb from '$lib/components/breadcrumb/breadcrumb.svelte';
  import { fade, slide } from 'svelte/transition';
  import {
    AlertTriangleIcon,
    CheckCircleIcon,
    Loader2,
    Trash2Icon,
    UsersIcon,
    PencilIcon,
    CircleAlertIcon,
  } from 'lucide-svelte';

  import Alert from '$components/alert/alert.svelte';
  import Drawer from '$components/drawer/drawer.svelte';
  import Drawerify from '$components/drawerify/drawerify.svelte';
  import Header from '$components/header/header.svelte';
  import Modalify from '$components/modalify/modalify.svelte';
  import Button from '$lib/components/button/button.svelte';
  import DeleteHousehold from '$lib/components/households/delete.svelte';
  import { ordinalSuffix, formatNumber } from '$lib/util/numbers';
  import BillDetails from '../../bills/[id=ulid]/+page.svelte';
  import DeleteBillPage from '../../bills/[id=ulid]/delete/+page.svelte';
  import CreateBillPage from '../../bills/create/+page.svelte';
  import EditHousehold from './edit/+page.svelte';
  import { asyncStore } from '$lib/util/asyncStore.svelte';

  let { data } = $props();

  let household = $derived(data.household);

  let billDetailUrl = $state('');
  let showBillDetails = $state(false);

  let editBillUrl = $state('');
  let showEditHousehold = $state(false);
  let showCreateBill = $state(false);
  let showCreateBillUrl = $state('');
  let showMembersDrawer = $state(false);

  $effect(() => {
    if (household === undefined) {
      goto('/dashboard/household');
    }
  });

  function showEdit(householdId: string) {
    showEditHousehold = true;
    editBillUrl = `/dashboard/household/${householdId}/edit`;
  }

  let showDeleteBill = $state(false);
  let deleteBillId = $state('');

  let showDelete = $state(false);

  type ResItem = Awaited<typeof data.bills>[number];
  type MappedByStatus = {
    paid: ResItem[];
    all: ResItem[];
    unpaid: ResItem[];
  };

  const st = asyncStore(async () => {
    const res = await data.bills;
    let obj: MappedByStatus = {
      paid: [],
      all: [],
      unpaid: [],
    };

    obj = res.reduce((all, cur) => {
      if (cur.payments.length === 1 && cur.payments[0].paidAt !== null) {
        all.paid.push(cur);
      } else if (cur.payments.length === 0 || cur.payments[0].paidAt === null) {
        all.unpaid.push(cur);
      }
      all.all.push(cur);
      return all;
    }, obj);

    return obj;
  });

  let filter: keyof MappedByStatus = $state('all');
  let selectedPayments: string[] = $state([]);
</script>

<svelte:head>
  <title>
    Household - {household.name}
  </title>
</svelte:head>

<Drawerify
  bind:open={showBillDetails}
  onclose={() => {
    showBillDetails = false;
    billDetailUrl = '';
    history.back();
  }}
  component={BillDetails}
  url={billDetailUrl}
/>

<Modalify
  bind:open={showDeleteBill}
  url={`/dashboard/bills/${deleteBillId}/delete`}
  component={DeleteBillPage}
  onclose={() => (showDeleteBill = false)}
>
  {#snippet header({ data })}
    Delete Bill
    {#await data?.bill}
      <Loader2 size="1em" />
    {:then billData}
      {#if billData}
        &ndash; {billData.billName}
      {/if}
    {/await}
  {/snippet}
  {#snippet footer()}
    &nbsp;
  {/snippet}
</Modalify>

<Drawerify
  bind:open={showCreateBill}
  url={showCreateBillUrl}
  component={CreateBillPage}
/>

<Drawerify
  url={editBillUrl}
  bind:open={showEditHousehold}
  onopen={() => {
    pushState(editBillUrl, {});
  }}
  onclose={() => {
    showEditHousehold = false;
    editBillUrl = '';
    pushState(`/dashboard/household/${household.id}`, {});
  }}
  component={EditHousehold}
/>

<DeleteHousehold
  {household}
  open={showDelete}
  on:close={() => (showDelete = false)}
/>

<Drawer
  bind:open={showMembersDrawer}
  onclose={() => (showMembersDrawer = false)}
>
  <div class="p-4">
    <Header tag="h1">Members</Header>
    {#await data.streamable.userHouseholds}
      <Loader2 size="3em" />
      <p>Add in a form to invite if the user is the owner.</p>
    {:then userMap}
      {#if userMap[household.id]}
        {#each userMap[household.id].users as user (user.id)}
          <div class="member">
            {user.userMetadata?.name || user.email}
          </div>
        {/each}
      {/if}
    {/await}
  </div>
</Drawer>

<div class="flex-grow p-5 @container/main">
  <div class="@5xl/main:w-10/12 @5xl/main:mx-auto flex flex-col gap-4">
    <Breadcrumb
      class="mt-4"
      crumbs={[
        {
          href: '/dashboard',
          link: 'Dashboard',
        },
        {
          href: '/dashboard/household',
          link: 'Households',
        },
        {
          href: `/dashboard/household/${household.id}`,
          link: household.name,
        },
      ]}
    />

    {#if household.ownerId === null}
      <Alert type="warning:ghost">
        <div class="flex items-center gap-4">
          <AlertTriangleIcon size="2em" />
          <div class="flex flex-col">
            <Header tag="h3">Ownerless Household</Header>
            <p>
              You are viewing a household whose original owner has been removed,
              either at their request or by administrators. Households who do
              not have owners will be removed periodically. Please use the
              action to the side in order to take ownership of this household.
            </p>
          </div>
        </div>
        {#snippet actions()}
          <form action="?/claimHousehold" method="post" use:enhance>
            <Button type="submit" variant="filled">Claim household</Button>
          </form>
        {/snippet}
      </Alert>
    {/if}

    <Header tag="h1" color="secondary">
      {household.name}
      {#snippet actions()}
        <a
          href="#/"
          class="flex gap-2 items-center hover:underline"
          onclick={(e) => {
            e.preventDefault();
            showMembersDrawer = true;
          }}
        >
          <UsersIcon size="1em" />
          Members
        </a>
        <Button
          size="sm"
          variant="primary:ghost"
          onclick={() => showEdit(household.id)}>Edit</Button
        >
        <Button
          size="sm"
          variant="destructive:ghost"
          onclick={() => (showDelete = true)}>Delete</Button
        >
      {/snippet}
    </Header>

    <main class="flex-grow flex flex-col gap-4">
      <Header tag="h3" tagClasses="sticky top-4 dark:bg-zinc-900/70">
        {#snippet actions()}
          <div class="btn-group variant-filled">
            <Button
              size="sm"
              variant={filter === 'all' ? 'primary' : 'custom'}
              onclick={() => {
                if (filter !== 'all') {
                  filter = 'all';
                }
              }}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={filter === 'unpaid' ? 'primary' : 'custom'}
              onclick={() => {
                if (filter !== 'unpaid') {
                  filter = 'unpaid';
                }
              }}
            >
              Unpaid
            </Button>
            <Button
              size="sm"
              variant={filter === 'paid' ? 'primary' : 'custom'}
              onclick={() => {
                if (filter !== 'paid') {
                  filter = 'paid';
                }
              }}
            >
              Paid
            </Button>
          </div>
          {#if selectedPayments.length > 0}
            <Button size="sm">Mark as Paid</Button>
          {/if}
          <Button
            size="sm"
            variant="secondary"
            onclick={() => {
              showCreateBillUrl = `/dashboard/bills/create?household-id[]=${household.id}`;
              showCreateBill = true;
            }}
          >
            Add
          </Button>
        {/snippet}
        Bills
      </Header>
      {#if st.isLoading}
        <div class="placeholder animate-pulse"></div>
      {:else if st.isSuccess}
        {#snippet displayBill(bill: ResItem)}
          <div
            role="listitem"
            class="bill card variant-filled-surface"
            in:fade
            out:slide
          >
            <header
              class="card-header pb-3 flex justify-between items-baseline"
            >
              <div class="inline-flex gap-2 items-center">
                {#if bill.payments.length === 1}
                  {@const payment = bill.payments[0]}
                  {#if payment.paidAt === null}
                    <input
                      type="checkbox"
                      name="pay[]"
                      value={payment.id}
                      class="checkbox"
                      bind:group={selectedPayments}
                    />
                  {:else}
                    <input
                      type="checkbox"
                      class="checkbox"
                      disabled={payment.paidAt !== null}
                      checked
                    />
                  {/if}
                {/if}
                <a
                  href={`/dashboard/bills/${bill.id}`}
                  class="text-xl font-semibold"
                  onclick={(e) => {
                    e.preventDefault();
                    billDetailUrl = `/dashboard/bills/${bill.id}`;
                    showBillDetails = true;
                    pushState(billDetailUrl, {});
                  }}
                >
                  {bill.billName} due on the {bill.dueDate}{ordinalSuffix(
                    bill.dueDate,
                  )} of each month
                </a>
              </div>
              <section>
                <Button
                  onclick={() => {
                    editBillUrl = `/dashboard/bills/${bill.id}/edit`;
                  }}>Edit</Button
                >
                <Button
                  variant="destructive:ghost"
                  onclick={() => {
                    showDeleteBill = true;
                    deleteBillId = bill.id;
                    pushState(`/dashboard/bills/${bill.id}/delete`, {});
                  }}
                >
                  <Trash2Icon size="1em" />
                </Button>
              </section>
            </header>
            <section class="p-4 pt-0 flex items-center gap-2">
              {#if bill.payments.length === 1}
                {@const payment = bill.payments[0]}
                Latest payment status:
                {#if payment.paidAt !== null}
                  <CheckCircleIcon
                    class="text-success-100-800-token"
                    size="1.25em"
                  />
                  Paid ({payment.paidAt.toLocaleString(undefined)})
                {:else}
                  <div class="contents">
                    <CircleAlertIcon
                      size="1em"
                      class="text-error-500-400-token"
                    />
                    Not Paid
                  </div>
                {/if}
              {/if}
            </section>
          </div>
        {/snippet}
        {@const bills = st.data[filter]}
        {@const groupedByDate = bills.reduce(
          (all, cur) => {
            if (all[cur.dueDate]) all[cur.dueDate].push(cur);
            else all[cur.dueDate] = [cur];
            return all;
          },
          {} as Record<number, (typeof bills)[number][]>,
        )}
        {#each Object.entries(groupedByDate) as [date, bills]}
          {@const dateTotal = bills.reduce((all, cur) => {
            if (cur.amount) all = all + cur.amount;
            return all;
          }, 0)}
          <Header tag="h4" color="secondary" class="font-bold">
            Due on {date}{ordinalSuffix(Number(date))}
            {#snippet actions()}
              Total due: {formatNumber(dateTotal)}
            {/snippet}
          </Header>
          <form action="?/dashboard/payments?/bulkPay" method="post">
            <div class="ml-8 flex flex-col gap-4">
              {#each bills as bill (bill.id)}
                {@render displayBill(bill)}
              {/each}
            </div>
          </form>
        {/each}
      {/if}
    </main>
  </div>
</div>
