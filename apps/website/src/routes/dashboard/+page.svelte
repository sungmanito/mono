<script lang="ts">
  import { invalidateAll, pushState, invalidate } from '$app/navigation';
  import Drawerify from '$components/drawerify/drawerify.svelte';
  import Button from '$lib/components/button/button.svelte';
  import Pill from '$lib/components/pill/pill.svelte';
  import ButtonGroup from '$lib/components/buttonGroup/buttonGroup.svelte';
  import { makeShowDrawerUtil } from '$utils/drawer.svelte';
  import { createQuery } from '@tanstack/svelte-query';
  import { CheckIcon, TriangleAlertIcon, WatchIcon } from 'lucide-svelte';
  import type { Component } from 'svelte';
  import type { Attachment } from 'svelte/attachments';
  import BillDetailsComponent from './bills/[id=ulid]/+page.svelte';
  import CreateBillComponent from './bills/create/+page.svelte';
  import CreatePaymentComponent from './payments/create/[id=ulid]/+page.svelte';
  import CreatePaymentsComponent from './payments/create/+page.svelte';
  import { hijack } from '$lib/attachments/hijack.svelte';
  import { ClockAlertIcon } from 'lucide-svelte';

  let { data } = $props();

  let createBillDrawer = makeShowDrawerUtil('/dashboard/bills/create');
  let createBillDetailsDrawer = makeShowDrawerUtil('/dashboard/bills/');
  let makeOrUpdatePayment = makeShowDrawerUtil('/dashbaord/payments/create');
  let makeMultiplePayments = makeShowDrawerUtil('/dashboard/payments/create');

  /** @description Hijacks nav on Anchor Elements, opening up the details modal */
  const hijackNav: Attachment<HTMLAnchorElement> = (el) => {
    function listener(e: MouseEvent) {
      e.preventDefault();
      createBillDetailsDrawer.url = el.href;
      createBillDetailsDrawer.show = true;
    }
    el.addEventListener('click', listener, false);

    return () => {
      el.removeEventListener('click', listener, false);
    };
  };

  let summary = $derived([
    {
      label: 'Paid This Month',
      value: data.groupings.paid.length,
      icon: CheckIcon,
      color: 'bg-green-100',
      iconBg: 'bg-green-500',
      iconText: 'text-green-700',
    },
    {
      label: 'Overdue',
      value: data.groupings.past.length,
      icon: TriangleAlertIcon,
      color: 'bg-red-100',
      iconBg: 'bg-red-500',
      iconText: 'text-red-700',
    },
    {
      label: 'Due This Week',
      value: data.groupings.thisWeek.length,
      icon: WatchIcon,
      color: 'bg-blue-100',
      iconBg: 'bg-blue-500',
      iconText: 'text-blue-500',
    },
  ]);

  let billsWithStatus = $derived(
    createQuery({
      queryKey: ['fuckers'],
      queryFn: async () => {
        // Simulate fetching data
        const da = await data.fuckers;
        return da;
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
    }),
  );

  const totalOutstanding = $derived(
    $billsWithStatus.data
      ?.filter((p) => p.payment === null || p.payment?.paidAt === null)
      .reduce((acc, bill) => acc + bill.amount, 0),
  );

  let filter: 'all' | 'overdue' | 'paid' = $state('all');

  let filteredBills = $derived.by(() => {
    if (!$billsWithStatus.isSuccess)
      return [] as NonNullable<typeof $billsWithStatus.data>;
    if (filter === 'all') return $billsWithStatus.data;
    if (filter === 'overdue') {
      return $billsWithStatus.data.filter((bill) => bill.status === 'overdue');
    }
    if (filter === 'paid') {
      return $billsWithStatus.data.filter((bill) => bill.status === 'paid');
    }
  });
</script>

<svelte:head>
  <title>Dashboard &ndash; Home</title>
</svelte:head>

<Drawerify
  bind:open={makeMultiplePayments.show}
  component={CreatePaymentsComponent}
  url={makeMultiplePayments.url}
/>

<Drawerify
  bind:open={makeOrUpdatePayment.show}
  url={makeOrUpdatePayment.url}
  component={CreatePaymentComponent as Component<{
    data: unknown;
    component: boolean;
    onclose: () => void;
  }>}
  onopen={() => {
    pushState(makeOrUpdatePayment.url, {});
  }}
  onclose={() => {
    history.go(-1);
    invalidate('household:payments');
  }}
/>

<Drawerify
  bind:open={createBillDrawer.show}
  url={createBillDrawer.url}
  component={CreateBillComponent as Component<{
    data: unknown;
    component: boolean;
    onclose: () => void;
  }>}
/>

<Drawerify
  bind:open={createBillDetailsDrawer.show}
  url={createBillDetailsDrawer.url}
  component={BillDetailsComponent as Component<{
    data: unknown;
    component: boolean;
    onclose: () => void;
  }>}
  onopen={() => {
    console.info('OPENED');
  }}
  onclose={() => {
    console.info('OKAY');
  }}
/>

<div class="min-h-screen container mx-auto mt-6">
  <!-- Header -->
  <div
    class="flex items-center justify-between rounded-2xl bg-surface-100-800-token p-6 mb-6 shadow"
  >
    <div class="flex items-center gap-3">
      <div class="text-3xl">🧾</div>
      <div class="text-3xl font-bold text-on-surface-token">Dashboard</div>
    </div>
    <div class="text-right">
      <div class="text-surface-700-200-token text-sm">Total Outstanding</div>
      <div class="text-3xl font-bold text-warning-300-600-token">
        {(totalOutstanding || 0).toLocaleString(undefined, {
          style: 'currency',
          currency: 'USD',
        })}
      </div>
    </div>
  </div>

  <!-- Summary Cards -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
    {#each summary as s}
      <div
        class="rounded-xl bg-surface-100-800-token p-5 flex flex-col gap-2 shadow transition-transform duration-200 hover:-translate-y-2"
      >
        <div class="flex items-center justify-between">
          <span class="text-surface-800-100-token">{s.label}</span>
          <div
            class={`rounded-lg text-center inline-block w-[45px] h-[45px] p-2 ${s.iconBg} bg-opacity-20`}
          >
            {#if typeof s.icon === 'string'}
              <span class={`text-2xl ${s.iconText}`}>{s.icon}</span>
            {:else}
              <s.icon class={`h-8 ${s.iconText}`} />
            {/if}
          </div>
        </div>
        <div class="text-3xl font-bold text-primary-600-300-token">
          {s.value}
        </div>
      </div>
    {/each}
  </div>

  <!-- Main Content -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Recent Bills -->
    <div class="lg:col-span-2">
      <div class="rounded-2xl bg-surface-800 p-6 shadow mb-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-2xl font-bold text-surface-800-100">Recent Bills</h2>
          <div class="flex gap-3">
            {#if $billsWithStatus.isStale}
              <Button
                class="btn-sm bg-gradient-to-r variant-gradient-tertiary-secondary rounded-lg"
                onclick={async () => {
                  await invalidateAll();
                  $billsWithStatus.refetch();
                }}
              >
                Refresh
              </Button>
            {/if}

            <ButtonGroup options={[]} />

            <div class="btn-group variant-filled">
              <button
                class={[
                  {
                    'bg-purple-500 text-white font-semibold': filter === 'all',
                    'px-3 py-1 text-purple-300 hover:bg-purple-100':
                      filter !== 'all',
                  },
                ]}
                onclick={() => (filter = 'all')}
              >
                All
              </button>
              <button
                onclick={() => (filter = 'overdue')}
                class={[
                  {
                    'bg-purple-500 text-white font-semibold':
                      filter === 'overdue',
                    'px-3 py-1 text-purple-300 hover:bg-purple-100':
                      filter !== 'overdue',
                  },
                ]}
              >
                Overdue
              </button>
              <button
                class={[
                  {
                    'bg-purple-500 text-white font-semibold': filter === 'paid',
                    'px-3 py-1 text-purple-300 hover:bg-purple-100':
                      filter !== 'paid',
                  },
                ]}
                onclick={() => (filter = 'paid')}
              >
                Paid
              </button>
            </div>
          </div>
        </div>
        <div class="flex flex-col gap-4">
          {#if $billsWithStatus.isSuccess}
            {#each filteredBills ?? [] as bill}
              <div
                class="flex items-center justify-between rounded-xl bg-surface-300 p-4 shadow border border-gray-100 transition-transform hover:translate-x-2"
              >
                <div class="flex items-center gap-3">
                  <div>
                    <div class="font-semibold text-gray-800 text-lg">
                      {bill.billName}
                    </div>
                    <div class="text-gray-700 text-sm">
                      Due: {bill.dueDate}
                    </div>
                    <div class="text-gray-700 text-sm">
                      {bill.householdName}
                    </div>
                  </div>
                </div>
                <div class="flex flex-col items-end">
                  <div class="font-bold text-lg text-gray-800">
                    ${bill.amount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <div class="flex items-center gap-3">
                    <Pill color={bill.status} display="inline" class="mt-1" />
                    <a
                      href={`/dashboard/bills/${bill.id}`}
                      class="btn-sm variant-filled-secondary rounded-lg"
                      {@attach hijackNav}
                    >
                      Details
                    </a>
                    <a
                      class="btn-sm rounded-full bg-gradient-to-br variant-gradient-primary-tertiary"
                      {@attach hijack({
                        onclick: (e) => {
                          console.info(bill, e.target.href);
                          makeOrUpdatePayment.url = e.target.href;
                          makeOrUpdatePayment.show = true;
                        },
                      })}
                      href={`/dashboard/payments/create/${bill.payment.id}`}
                    >
                      {#if bill.payment?.paidAt !== null}
                        Update
                      {:else}
                        Pay
                      {/if}
                    </a>
                  </div>
                </div>
              </div>
            {/each}
          {:else if $billsWithStatus.isLoading}
            <div class="placeholder">&nbsp;</div>
          {/if}
        </div>
      </div>
    </div>
    <!-- Quick Actions -->
    <div>
      <div class="rounded-2xl bg-surface-800 p-6 shadow mb-6">
        <h2 class="text-xl font-bold text-surface-800-100-token mb-4">
          Quick Actions
        </h2>
        <Button
          class="w-full mb-3 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-purple-400 text-white font-semibold text-lg flex items-center justify-center gap-2"
          variant="custom"
          onclick={() => {
            createBillDrawer.show = true;
          }}
        >
          ➕ Add New Bill
        </Button>
        <div class="flex gap-3">
          <button
            class="w-full mb-3 py-2 rounded-xl bg-yellow-100 text-yellow-800 font-semibold flex items-center gap-2 justify-center"
            onclick={() => {
              const ids = data.groupings.thisWeek
                .filter((bill) => bill.payment !== null)
                .map((b) => `payments[]=${b.payment.id}`)
                .join('&');
              makeMultiplePayments.url = `/dashboard/payments/create?${ids}`;
              makeMultiplePayments.show = true;
            }}
          >
            📁 Pay This Week
          </button>
          <button
            class="w-full mb-3 py-2 rounded-xl bg-red-100 text-red-700 font-semibold flex items-center gap-2 justify-center"
            onclick={() => {
              const ids = data.groupings.past
                .map((bill) => `payments[]=${bill.payment.id}`)
                .join('&');
              console.info(ids);
              makeMultiplePayments.url = `/dashboard/payments/create?${ids}`;
              makeMultiplePayments.show = true;
            }}
          >
            <ClockAlertIcon size="1em" />
            Pay Overdue
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
