<script lang="ts">
  import { enhance } from '$app/forms';
  import {
    goto,
    preloadData,
    pushState,
    invalidate,
    invalidateAll,
  } from '$app/navigation';
  import Breadcrumb from '$lib/components/breadcrumb/breadcrumb.svelte';
  import { makeShowDrawerUtil } from '$lib/util/drawer.svelte';
  import {
    AlertTriangleIcon,
    CheckCircleIcon,
    CircleAlertIcon,
    Loader2,
    Trash2Icon,
    UsersIcon,
    XIcon,
  } from 'lucide-svelte';
  import { fade, slide } from 'svelte/transition';

  import Alert from '$components/alert/alert.svelte';
  import Drawerify from '$components/drawerify/drawerify.svelte';
  import Dropzone from '$components/dropzone/dropzone.svelte';
  import FormLabel from '$components/formLabel/formLabel.svelte';
  import Header from '$components/header/header.svelte';
  import Modalify from '$components/modalify/modalify.svelte';
  import Button from '$lib/components/button/button.svelte';
  import Drawer from '$lib/components/drawer/drawer.svelte';
  import Expandable from '$lib/components/expandable/expandable.svelte';
  import DeleteHousehold from '$lib/components/households/delete.svelte';
  import { asyncStore } from '$lib/util/asyncStore.svelte';
  import { formatNumber, ordinalSuffix } from '$lib/util/numbers';
  import { createQueries } from '@tanstack/svelte-query';
  import { SvelteMap } from 'svelte/reactivity';
  import BillDetails from '../../bills/[id=ulid]/+page.svelte';
  import DeleteBillPage from '../../bills/[id=ulid]/delete/+page.svelte';
  import CreateBillPage from '../../bills/create/+page.svelte';
  import EditBillPage from '../../bills/[id=ulid]/edit/+page.svelte';
  import type { PageData as CreatePaymentData } from '../../payments/create/[id=ulid]/$types';
  import EditHousehold from './edit/+page.svelte';

  let { data } = $props();

  let household = $derived(data.household);

  let billDetailUrl = $state('');
  let showBillDetails = $state(false);

  let editHouseholdUrl = $state('');
  let editHousehold = makeShowDrawerUtil('');
  let editBill = makeShowDrawerUtil('');
  let showCreateBill = $state(false);
  let showCreateBillUrl = $state('');
  let showMembersDrawer = $state(false);

  $effect(() => {
    if (household === undefined) {
      goto('/dashboard/household');
    }
  });

  function showEdit(householdId: string) {
    editHousehold.url = `/dashboard/household/${householdId}/edit`;
    editHousehold.show = true;
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

  const st = $derived(
    asyncStore(async () => {
      const res = await data.bills;
      let obj: MappedByStatus = {
        paid: [],
        all: [],
        unpaid: [],
      };

      obj = res.reduce((all, cur) => {
        if (cur.isPaid) {
          all.paid.push(cur);
        } else {
          all.unpaid.push(cur);
        }
        all.all.push(cur);
        return all;
      }, obj);

      return obj;
    }),
  );

  let filter: keyof MappedByStatus = $state('all');
  let selectedPayments: string[] = $state([]);

  const paymentsData = $derived(
    createQueries({
      queries: selectedPayments.map((id) => ({
        queryKey: ['multi', 'drawer', id],
        queryFn: async () => {
          const data = await preloadData(`/dashboard/payments/create/${id}`);
          if (data.type === 'loaded' && data.status === 200) {
            return data.data as CreatePaymentData;
          }
          throw new Error(`Couldn't load info for payment ${id}`);
        },
      })),
    }),
  );
  let showMultiPayments = $state(false);
  let previewUrlsByPayment = new SvelteMap<string, string>();

  function changeFile(e: Event & { currentTarget: HTMLInputElement }) {
    const files = e.currentTarget.files;
    const name = e.currentTarget.name;
    if (files) {
      for (const file of files) {
        previewUrlsByPayment.set(name, URL.createObjectURL(file));
      }
    }
  }
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

<Drawerify
  bind:open={editBill.show}
  url={editBill.url}
  onclose={() => {
    history.back();
  }}
  component={EditBillPage}
/>

<Drawer
  bind:open={showMultiPayments}
  onclose={() => (showMultiPayments = false)}
>
  {#snippet children({ close })}
    <form
      class="p-4 @container"
      action="/dashboard/payments?/bulkPay"
      method="post"
      enctype="multipart/form-data"
      use:enhance={async () => {
        return ({ result }) => {
          if (result.type === 'success') {
            invalidate('user:payments');
            invalidateAll();
            close();
          } else if (result.type === 'failure') {
            console.error(result.data);
          }
        };
      }}
    >
      <input type="hidden" name="household-id" value={data.household.id} />
      <div class="flex justify-end">
        <button onclick={close}>
          <XIcon size="1.25em" />
        </button>
      </div>

      {#snippet formButtons()}
        <div class="flex gap-4 my-4">
          <Button type="button" variant="filled" onclick={close}>Close</Button>
          <Button type="submit">Save</Button>
        </div>
      {/snippet}

      {@render formButtons()}

      {#snippet paymentItem(itm: CreatePaymentData)}
        <input type="hidden" name="id[]" value={itm.payment.id} />
        <div>
          <fieldset class="border p-4 rounded">
            <legend class="px-3 text-lg font-semibold">
              {itm.payment.billName}
              <small>
                ({itm.payment.forMonthD.toLocaleDateString(undefined, {
                  month: 'long',
                })})
              </small>
            </legend>

            <div class="grid grid-cols-3 gap-4">
              <FormLabel label="Bill Name">
                <input class="input" value={itm.payment.billName} disabled />
              </FormLabel>
              <FormLabel>
                {#snippet label()}
                  <strong class="inline-flex items-baseline gap-2">
                    Upload Proof
                    <small>(Recommended) </small>
                  </strong>
                {/snippet}
                <Dropzone
                  name={`${itm.payment.id}[proof]`}
                  onchange={changeFile}
                >
                  {#snippet children()}
                    {#if previewUrlsByPayment.has(`${itm.payment.id}[proof]`)}
                      <img
                        src={previewUrlsByPayment.get(
                          `${itm.payment.id}[proof]`,
                        )}
                        class="h-28 w-auto"
                        alt="Payment receipt preview"
                      />
                    {:else}
                      Upload proof here
                    {/if}
                  {/snippet}
                </Dropzone>
              </FormLabel>
              <Expandable
                class="col-span-3 grid grid-cols-subgrid"
                headerContainerClasses="col-span-3 flex gap-4"
                hideInstead
              >
                {#snippet header()}
                  <strong>Optional</strong>
                {/snippet}
                <FormLabel label="Amount (optional)">
                  <input
                    class="input"
                    name={`${itm.payment.id}[amount]`}
                    placeholder={`Amount Paid (min ${formatNumber(itm.payment.billAmount || 0, itm.payment.billCurrency)})`}
                  />
                </FormLabel>
                <FormLabel label="Notes (optional)">
                  <textarea
                    class="textarea"
                    name={`${itm.payment.id}[notes]`}
                    placeholder="Any notes about this payment other household members should know?"
                  ></textarea>
                </FormLabel>
              </Expandable>
            </div>
          </fieldset>
        </div>
      {/snippet}
      <div class="flex flex-col gap-4">
        {#each $paymentsData as payment}
          {#if payment.isError}
            {payment.error.message}
          {:else if payment.isLoading}
            <div class="placeholder animate-pulse"></div>
          {:else if payment.isSuccess}
            {@render paymentItem(payment.data)}
          {/if}
        {/each}
        {@render formButtons()}
      </div>
    </form>
  {/snippet}
</Drawer>

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
  url={editHousehold.url}
  bind:open={editHousehold.show}
  onopen={() => {
    pushState(editHouseholdUrl, {});
  }}
  onclose={() => {
    editHousehold.url = '';
    history.back();
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
          type="button"
          onclick={() => showEdit(household.id)}>Edit</Button
        >
        <Button
          size="sm"
          variant="destructive:ghost"
          type="button"
          onclick={() => (showDelete = true)}>Delete</Button
        >
      {/snippet}
    </Header>

    <main class="flex-grow flex flex-col gap-4">
      <Header tag="h3" tagClasses="sticky top-4 dark:bg-zinc-900/70">
        {#snippet actions()}
          <div class="btn-group variant-filled">
            {#snippet actionButton(action: keyof MappedByStatus, text: string)}
              <Button
                size="sm"
                variant={filter === action ? 'primary' : 'custom'}
                onclick={() => {
                  if (filter !== action) {
                    filter = action;
                  }
                }}
              >
                {text}
              </Button>
            {/snippet}

            {@render actionButton('all', 'All')}
            {@render actionButton('unpaid', 'Unpaid')}
            {@render actionButton('paid', 'Paid')}
          </div>
          {#if selectedPayments.length > 0}
            <Button size="sm" onclick={() => (showMultiPayments = true)}>
              Mark {selectedPayments.length} as Paid
            </Button>
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
        <div class="card">
          <div class="p-4 flex flex-col gap-4">
            <div class="placeholder animate-pulse h-7"></div>
            <div class="placeholder animate-pulse"></div>
          </div>
        </div>
        <div class="card">
          <div class="p-4 flex flex-col gap-4">
            <div class="placeholder animate-pulse h-7"></div>
            <div class="placeholder animate-pulse"></div>
          </div>
        </div>
        <div class="card">
          <div class="p-4 flex flex-col gap-4">
            <div class="placeholder animate-pulse h-7"></div>
            <div class="placeholder animate-pulse"></div>
          </div>
        </div>
        <div class="card">
          <div class="p-4 flex flex-col gap-4">
            <div class="placeholder animate-pulse h-7"></div>
            <div class="placeholder animate-pulse"></div>
          </div>
        </div>
        <div class="card">
          <div class="p-4 flex flex-col gap-4">
            <div class="placeholder animate-pulse h-7"></div>
            <div class="placeholder animate-pulse"></div>
          </div>
        </div>
      {:else if st.isSuccess}
        {#snippet displayBill(bill: ResItem)}
          {@const today = new Date()}
          {@const pastDue = bill.dueDate < today.getDate() && !bill.isPaid}
          <div
            role="listitem"
            class={['bill card', pastDue && 'variant-ghost-error']}
            in:fade
            out:slide
          >
            <header
              class="card-header pb-3 flex justify-between items-baseline"
            >
              <div class="inline-flex gap-2 items-center">
                {#if !bill.isPaid}
                  <input
                    type="checkbox"
                    name="pay[]"
                    value={bill.paymentId}
                    class="checkbox"
                    bind:group={selectedPayments}
                  />
                {:else}
                  <CheckCircleIcon
                    size="1em"
                    class="text-success-400-500-token"
                  />
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
                  {bill.billName}
                  {#if bill.amount}
                    &ndash;
                    {formatNumber(bill.amount, bill.currency)}
                  {/if}
                </a>
              </div>
              <section>
                <Button
                  onclick={() => {
                    editBill.url = `/dashboard/bills/${bill.id}/edit`;
                    editBill.show = true;
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
              Latest payment status:
              {#if bill.paidAt !== null}
                <CheckCircleIcon
                  class="text-success-400-500-token"
                  size="1.25em"
                />
                Paid ({bill.paidAt.toLocaleString(undefined)})
              {:else}
                <div class="contents">
                  <CircleAlertIcon
                    size="1em"
                    class="text-error-500-400-token"
                  />
                  Not Paid
                </div>
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
          <Expandable open>
            {#snippet header()}
              <Header
                tag="h4"
                color="secondary"
                class="font-bold"
                tagClasses="gap-4"
              >
                Due on {date}{ordinalSuffix(Number(date))}
                {#snippet actions()}
                  Total due: {formatNumber(dateTotal)}
                {/snippet}
              </Header>
            {/snippet}
            <div class="ml-8 flex flex-col gap-4">
              {#each bills as bill (bill.id)}
                {@render displayBill(bill)}
              {/each}
            </div>
          </Expandable>
        {:else}
          <div class="flex justify-center">
            <em>No bills match this filter</em>
          </div>
        {/each}
      {/if}
    </main>
  </div>
</div>

<style>
  dt {
    font-weight: bold;
  }
  dd {
    margin-left: 1.5em;
  }
</style>
