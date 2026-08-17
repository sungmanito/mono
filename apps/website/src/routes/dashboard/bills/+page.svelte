<script lang="ts">
  import { replaceState } from '$app/navigation';
  import { hijackNav } from '$lib/attachments/hijack.svelte';
  import Breadcrumb from '$lib/components/breadcrumb/breadcrumb.svelte';
  import Button from '$lib/components/button/button.svelte';
  import Drawerify from '$lib/components/drawerify/drawerify.svelte';
  import Header from '$lib/components/header/header.svelte';
  import Modal from '$lib/components/modal/modal.svelte';
  import Pill from '$lib/components/pill/pill.svelte';
  import Progress, {
    type ProgressPins,
  } from '$lib/components/progress/progress.svelte';
  import { makeShowDrawerUtil } from '$lib/util/drawer.svelte';
  import { getLastDayOfMonth } from '$utils/date';
  import { formatNumber, ordinalSuffix } from '$utils/numbers';
  import { PencilIcon, PlusIcon, TrashIcon } from 'lucide-svelte';
  import type { Component } from 'svelte';
  import CreateBillComponent from './create/+page.svelte';
  import EditBillDetailsComponent from './edit/[ids=ulids]/+page.svelte';
  import BillDetailsComponent from './[id=ulid]/+page.svelte';
  import PaymentDetailsComponent from '../payments/[id=ulid]/+page.svelte';
  import CreatePaymentComponent from '../payments/create/[id=ulid]/+page.svelte';
  import {
    deleteBills,
    getUserBillsWithPaymentStatus,
  } from '$lib/remotes/bills.remote';
  import {
    getPaymentHistoryMonths,
    togglePayment,
  } from '$lib/remotes/payments.remote';

  type StatusFilter = 'all' | 'overdue' | 'upcoming' | 'paid';

  let deleteModalOpen = $state(false);
  let deleteFormEl: HTMLFormElement = $state()!;

  let selectedBillIds: string[] = $state([]);
  let filter: StatusFilter = $state('all');

  let createBillStore = makeShowDrawerUtil('/dashboard/bills/create');
  let editBillStore = makeShowDrawerUtil('/dashboard/bills');
  let showBillDetailsStore = makeShowDrawerUtil('/dashboard/bills/:billId');
  let paymentDetailsStore = makeShowDrawerUtil();
  let markPaidStore = makeShowDrawerUtil();

  /**
   * @description Fetches and loads the data for creating new bills for the given householdIds
   * @param householdIds
   */
  async function fetchCreateBillData(householdIds?: string[]) {
    createBillStore.show = true;
    const params =
      householdIds?.map((h) => `household-id[]=${h}`).join('&') || '';

    createBillStore.url = `/dashboard/bills/create${params ? '?' + params : ''}`;
    history.pushState(null, '', createBillStore.url);
  }

  /**
   * @description Updates the edit bill data to show the editing drawer
   * @param ids
   */
  async function fetchEditBillData(ids: string[]) {
    if (ids.length === 0) return;
    selectedBillIds = ids;
    editBillStore.show = true;
    editBillStore.url = `/dashboard/bills/edit/${ids.join(',')}`;
    history.pushState(null, '', editBillStore.url);
  }

  const paymentHistoryMonths = $derived(await getPaymentHistoryMonths());
  let selectedMonth = $derived(
    paymentHistoryMonths.length ? paymentHistoryMonths[0].month : null,
  );

  const billsByHousehold = $derived(
    await getUserBillsWithPaymentStatus(selectedMonth?.toISOString()),
  );

  const filteredByHousehold = $derived(
    Object.fromEntries(
      Object.entries(billsByHousehold)
        .map(([householdId, { name, bills }]) => [
          householdId,
          {
            name,
            bills: bills.filter((b) => filter === 'all' || b.status === filter),
          },
        ])
        .filter(
          ([, group]) => (group as { bills: unknown[] }).bills.length > 0,
        ),
    ) as typeof billsByHousehold,
  );

  // Every bill gets a pin, even ones without a payment row yet for the
  // selected month — its due date is reconstructed from the bill's
  // due-date-of-month so the progress bar reflects the full picture.
  const paymentPins = $derived(
    Object.values(billsByHousehold).flatMap(({ bills }) =>
      bills.map(
        (b) =>
          ({
            status: b.status === 'paid' ? 'paid' : 'pending',
            name: b.billName,
            date:
              b.payment?.forMonthD ??
              (selectedMonth
                ? new Date(
                    selectedMonth.getUTCFullYear(),
                    selectedMonth.getUTCMonth(),
                    b.dueDate,
                  )
                : new Date()),
          }) satisfies ProgressPins,
      ),
    ),
  );

  function refreshBills() {
    getUserBillsWithPaymentStatus(selectedMonth?.toISOString()).refresh();
  }

  function showPaymentDetails(paymentId: string) {
    paymentDetailsStore.url = `/dashboard/payments/${paymentId}`;
    paymentDetailsStore.show = true;
    history.pushState(null, '', paymentDetailsStore.url);
  }

  function showMarkPaid(paymentId: string) {
    markPaidStore.url = `/dashboard/payments/create/${paymentId}`;
    markPaidStore.show = true;
    history.pushState(undefined, '', markPaidStore.url);
  }
</script>

<svelte:head>
  <title>Sungmanito &ndash; Bills &amp; Payments</title>
</svelte:head>

<Drawerify
  bind:open={createBillStore.show}
  url={createBillStore.url}
  onclose={() => {
    createBillStore.show = false;
    replaceState('/dashboard/bills', {});
    refreshBills();
  }}
  component={CreateBillComponent as Component<{
    data: unknown;
    component: boolean;
    onclose: () => void;
  }>}
/>

<Drawerify
  bind:open={editBillStore.show}
  url={editBillStore.url}
  onclose={async () => {
    editBillStore.show = false;
    replaceState('/dashboard/bills', {});
    selectedBillIds = [];
    refreshBills();
  }}
  component={EditBillDetailsComponent as Component<{
    data: unknown;
    component: boolean;
    onclose: () => void;
  }>}
  ids={selectedBillIds}
/>

<Drawerify
  bind:open={showBillDetailsStore.show}
  url={showBillDetailsStore.url}
  onclose={() => {
    showBillDetailsStore.show = false;
    history.replaceState(null, '', '/dashboard/bills');
  }}
  component={BillDetailsComponent as Component<{
    data: unknown;
    component: boolean;
    onclose: () => void;
  }>}
  id={showBillDetailsStore.url.split('/').at(-1)}
/>

<Drawerify
  bind:open={paymentDetailsStore.show}
  url={paymentDetailsStore.url}
  onclose={() => {
    paymentDetailsStore.show = false;
    history.replaceState(null, '', '/dashboard/bills');
  }}
  component={PaymentDetailsComponent as Component<{
    data: unknown;
    component: boolean;
    onclose: () => void;
  }>}
  id={paymentDetailsStore.url.split('/').at(-1)}
/>

<Drawerify
  bind:open={markPaidStore.show}
  url={markPaidStore.url}
  onclose={() => {
    markPaidStore.show = false;
    history.back();
    refreshBills();
  }}
  component={CreatePaymentComponent as Component<{
    data: unknown;
    component: boolean;
    onclose: () => void;
  }>}
  id={markPaidStore.url.split('/').at(-1)}
/>

<!-- Delete modal — uses deleteBills remote form -->
<form
  bind:this={deleteFormEl}
  {...deleteBills.enhance(async ({ submit }) => {
    await submit();
    deleteModalOpen = false;
    selectedBillIds = [];
    refreshBills();
  })}
>
  {#each selectedBillIds as id}
    <input type="hidden" name="billId[]" value={id} />
  {/each}
  <Modal
    bind:open={deleteModalOpen}
    onclose={() => {
      deleteModalOpen = false;
      selectedBillIds = [];
    }}
  >
    {#snippet header()}
      Delete Bills?
    {/snippet}
    {#snippet footer()}
      <Button type="button" onclick={() => deleteFormEl.requestSubmit()}
        >Delete</Button
      >
    {/snippet}
    <div class="max-w-72">
      <p>
        Are you sure you want to delete
        <strong>{selectedBillIds.length}</strong>
        bills?
      </p>
      <p>
        This action cannot be undone, and will delete all payment history
        associated with this bill.
      </p>
    </div>
  </Modal>
</form>

<svelte:boundary>
  {#snippet pending()}
    <div class="container mx-auto md:w-2/3 lg:4/5">
      <div
        class="h-8 w-48 rounded animate-pulse bg-surface-300 mb-6 mt-6"
      ></div>
      <div class="h-10 w-full rounded animate-pulse bg-surface-300 mb-6"></div>
      {#each Array(3) as _}
        <div
          class="h-8 w-64 rounded animate-pulse bg-surface-300 mt-8 mb-4"
        ></div>
        {#each Array(4) as _}
          <div class="h-20 rounded-lg animate-pulse bg-surface-300 mt-6"></div>
        {/each}
      {/each}
    </div>
  {/snippet}

  <div class="container mx-auto md:w-2/3 lg:4/5">
    <Breadcrumb
      class="mt-6 mb-4"
      crumbs={[
        { href: '/dashboard', link: 'Dashboard' },
        { href: '/dashboard/bills', link: 'Bills & Payments' },
      ]}
    />
    <Header tagClasses="mb-6">
      Bills &amp; Payments
      {#snippet actions()}
        <div class="flex flex-wrap gap-2 items-center justify-end">
          <select
            name="currentMonth"
            class="select"
            bind:value={selectedMonth}
            aria-label="Month"
          >
            {#each paymentHistoryMonths as month}
              <option value={month.month}>
                {new Date(month.month).toLocaleDateString(undefined, {
                  month: 'long',
                  year: 'numeric',
                  timeZone: 'UTC',
                })}
              </option>
            {/each}
          </select>

          <div class="btn-group variant-filled">
            {#each [['all', 'All'], ['overdue', 'Overdue'], ['upcoming', 'Pending'], ['paid', 'Paid']] as [value, label] (value)}
              <button
                type="button"
                class={[
                  {
                    'bg-purple-500 text-white font-semibold': filter === value,
                    'px-3 py-1 text-purple-300 hover:bg-purple-100':
                      filter !== value,
                  },
                ]}
                onclick={() => (filter = value as StatusFilter)}
              >
                {label}
              </button>
            {/each}
          </div>

          <Button
            variant="destructive"
            disabled={selectedBillIds.length === 0}
            onclick={() => {
              deleteModalOpen = true;
            }}
            aria-label="Delete selected bills"
          >
            <TrashIcon size="1rem" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onclick={() => fetchEditBillData(selectedBillIds)}
            disabled={selectedBillIds.length === 0}
            aria-label="Edit selected bills"
          >
            <PencilIcon size="1rem" />
          </Button>
          <Button
            variant="primary"
            size="sm"
            onclick={() => fetchCreateBillData()}
          >
            <PlusIcon size="1rem" class="mr-2" />
            New Bill
          </Button>
        </div>
      {/snippet}
    </Header>

    <p class="font-xl font-semibold text-zinc-400">
      Showing all bills for {selectedMonth
        ? selectedMonth.toLocaleDateString(undefined, {
            month: 'long',
            year: 'numeric',
            timeZone: 'UTC',
          })
        : ''}
    </p>

    <p class="text-zinc-400 mt-4">Monthly Progress</p>
    <Progress
      today={selectedMonth ? new Date(selectedMonth) : new Date()}
      end={selectedMonth
        ? getLastDayOfMonth(selectedMonth)
        : getLastDayOfMonth(new Date())}
      pins={paymentPins}
    />

    <div>
      {#each Object.entries(filteredByHousehold) as [householdId, { name: householdName, bills }] (householdId)}
        <Header tag="h3" class="mt-8 mb-4">
          {#snippet actions()}
            {@const isIndeterminate = (() => {
              const selectedSet = new Set(selectedBillIds);
              const theseBillIds = new Set(bills.map((b) => b.id));
              const difference = theseBillIds.difference(selectedSet);
              const intersection = selectedSet.intersection(theseBillIds);
              return (
                intersection.size > 0 &&
                selectedSet.size > 0 &&
                difference.size > 0
              );
            })()}
            {@const checked = bills.every((bill) =>
              selectedBillIds.includes(bill.id),
            )}
            <input
              type="checkbox"
              class="checkbox"
              onchange={() => {
                const selectedSet = new Set(selectedBillIds);
                const theseBillIds = new Set(bills.map((b) => b.id));
                const diff = theseBillIds.difference(selectedSet);
                if (diff.size === 0) {
                  theseBillIds.forEach((id) => selectedSet.delete(id));
                } else {
                  diff.forEach((id) => selectedSet.add(id));
                }
                selectedBillIds = Array.from(selectedSet);
              }}
              indeterminate={isIndeterminate}
              {checked}
            />
          {/snippet}

          {householdName}
        </Header>
        {#each bills as bill (bill.id)}
          <div
            class="p-5 ml-8 mt-6 rounded-lg variant-filled-surface outline-orange-400"
            role="listitem"
            aria-label={bill.billName}
          >
            <Header tag="h4" color="secondary">
              <a
                href={`/dashboard/bills/${bill.id}`}
                {@attach hijackNav({
                  store: showBillDetailsStore,
                  onclick: (e) => {
                    e.preventDefault();
                    history.pushState(null, '', `/dashboard/bills/${bill.id}`);
                  },
                })}
              >
                {bill.billName}
              </a>

              {#snippet actions()}
                <input
                  class="checkbox"
                  type="checkbox"
                  value={bill.id}
                  onchange={() => {
                    const set = new Set(selectedBillIds);
                    if (set.has(bill.id)) {
                      set.delete(bill.id);
                    } else {
                      set.add(bill.id);
                    }
                    selectedBillIds = Array.from(set);
                  }}
                  checked={selectedBillIds.includes(bill.id)}
                  aria-label={`Select ${bill.billName}`}
                />
              {/snippet}
            </Header>
            <p class="text-sm text-secondary-foreground">
              {householdName} &ndash; {bill.dueDate}{ordinalSuffix(
                bill.dueDate,
              )} &ndash; {formatNumber(bill.amount, bill.currency)}
            </p>

            <div class="flex items-center gap-3 mt-3">
              {#if bill.payment}
                <button
                  type="button"
                  class="unstyled"
                  onclick={() => showPaymentDetails(bill.payment!.id)}
                  aria-label="View payment details"
                >
                  <Pill color={bill.status} display="inline" />
                </button>
              {:else}
                <Pill color={bill.status} display="inline" />
              {/if}

              {#if bill.payment && bill.status === 'paid'}
                {@const paymentFormInstance = togglePayment.for(
                  bill.payment.id,
                )}
                <form
                  {...paymentFormInstance.enhance(async ({ submit }) => {
                    await submit();
                    refreshBills();
                  })}
                >
                  <button
                    class="btn btn-sm variant-outline-primary"
                    type="submit"
                    name="paymentId"
                    value={bill.payment.id}
                    disabled={paymentFormInstance.pending > 0}
                  >
                    Unmark as paid
                  </button>
                </form>
              {:else if bill.payment}
                <button
                  class="btn btn-sm variant-outline-secondary"
                  type="button"
                  onclick={() => showMarkPaid(bill.payment!.id)}
                >
                  Mark as paid
                </button>
              {/if}
            </div>

            <footer class="mt-4">
              <Button
                variant="destructive:ghost"
                size="sm"
                onclick={() => {
                  selectedBillIds = [bill.id];
                  deleteModalOpen = true;
                }}
                aria-label="Delete"
              >
                <TrashIcon size="1rem" />
              </Button>
              <Button
                variant="custom"
                class="variant-ghost-tertiary"
                size="sm"
                aria-label="Edit"
                type="button"
                onclick={() => {
                  fetchEditBillData([bill.id]);
                }}
              >
                <PencilIcon size="1rem" />
              </Button>
            </footer>
          </div>
        {/each}
      {:else}
        <p class="mt-6">There are no bills that match this filter</p>
      {/each}
    </div>
  </div>
</svelte:boundary>
