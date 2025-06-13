<script lang="ts">
  import { enhance } from '$app/forms';
  import { pushState, replaceState } from '$app/navigation';
  import Drawerify from '$components/drawerify/drawerify.svelte';
  import Button from '$lib/components/button/button.svelte';
  import Header from '$lib/components/header/header.svelte';
  import { HomeIcon, PlusIcon } from 'lucide-svelte';
  import CreateBillComponent from './bills/create/+page.svelte';
  import BillDetailsComponent from './bills/[id=ulid]/+page.svelte';
  import CreateHousehold from './household/create/+page.svelte';
  import CreatePayment from './payments/create/[id=ulid]/+page.svelte';
  import {
    WatchIcon,
    HourglassIcon,
    CheckIcon,
    TriangleAlertIcon,
  } from 'lucide-svelte';
  import Pill from '$lib/components/pill/pill.svelte';
  import { makeShowDrawerUtil } from '$utils/drawer.svelte';
  import type { Attachment, Component } from 'svelte';
  import { createQuery } from '@tanstack/svelte-query';

  let { data } = $props();

  let createBillDrawer = makeShowDrawerUtil('/dashboard/bills/create');
  let createBillDetailsDrawer = makeShowDrawerUtil('/dashboard/bills/');

  let createPaymentDrawerUrl = $state('/');
  let showCreateHousehold = $state(false);

  const hijackNav: Attachment = (el: HTMLAnchorElement) => {
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

  async function showPaymentDrawer(paymentId: string) {
    createPaymentDrawerUrl = `/dashboard/payments/create/${paymentId}`;
  }

  async function showCreateHouseholdDrawer() {
    showCreateHousehold = true;
  }

  // Dummy data for UI mockup (replace with real data as needed)
  const summary = [
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
      value: data.bills.filter((bill) => {
        const dueDate = bill.payments?.forMonthD || new Date();
        const now = new Date();
        const oneWeekFromNow = new Date();
        oneWeekFromNow.setDate(now.getDate() + 7);
        return dueDate >= now && dueDate <= oneWeekFromNow;
      }).length,
      icon: WatchIcon,
      color: 'bg-blue-100',
      iconBg: 'bg-blue-500',
      iconText: 'text-blue-500',
    },
  ];

  const totalOutstanding = $derived(
    data.bills
      .filter((p) => p.payments === null || p.payments?.paidAt === null)
      .reduce((acc, bill) => acc + bill.bills.amount, 0),
  );

  const unpaid = $derived(
    data.bills.filter((p) => p.payments?.paidAt === null),
  );

  let rBills = $derived(data.bills.slice(0, 10));

  const bob = $derived(
    createQuery({
      queryKey: ['fuckers'],
      queryFn: async () => {
        // Simulate fetching data
        const da = await data.fuckers;
        return da;
      },
    }),
  );

  const upcoming = [
    { name: 'Netflix', amount: 15.99, due: '6/9/2025' },
    { name: 'Electric Bill', amount: 125.5, due: '6/14/2025' },
    { name: 'Car Insurance', amount: 145.0, due: '6/19/2025' },
  ];
</script>

<svelte:head>
  <title>Dashboard &ndash; Home</title>
</svelte:head>

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
        {totalOutstanding.toLocaleString(undefined, {
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
          <div class="btn-group variant-filled">
            <button class="bg-purple-500 text-white font-semibold">All</button>
            <button class="px-3 py-1 text-purple-300 hover:bg-purple-100"
              >Overdue</button
            >
            <button class="px-3 py-1 text-purple-300 hover:bg-purple-100"
              >Paid</button
            >
          </div>
        </div>
        <div class="flex flex-col gap-4">
          {#if $bob.isSuccess}
            {#each $bob.data as bill}
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
                      class="btn-sm bg-gradient-to-r variant-gradient-tertiary-secondary rounded-lg"
                      {@attach hijackNav}
                    >
                      Details
                    </a>
                  </div>
                </div>
              </div>
            {/each}
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
        <button
          class="w-full mb-3 py-2 rounded-xl bg-yellow-100 text-yellow-800 font-semibold flex items-center gap-2 justify-center"
        >
          📁 Pay All Due
        </button>
        <div>
          <h3 class="font-semibold text-surface-800-100-token mb-2">
            Upcoming
          </h3>
          <div class="flex flex-col gap-2">
            {#each upcoming as up}
              <div
                class="flex items-center justify-between rounded-lg bg-surface-300 px-3 py-2"
              >
                <a
                  href={`/dashboard/payments/${up.id}`}
                  class="flex items-center gap-3"
                >
                  <Header
                    tag="h6"
                    color="custom"
                    class="text-zinc-800 font-medium"
                  >
                    {up.name}
                  </Header>
                  <div class="text-gray-600 text-xs">
                    ${up.amount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </div>
                </a>
                <div class="text-xs text-gray-600">{up.due}</div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
