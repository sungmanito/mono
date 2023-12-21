<script lang="ts">
  import { AppRail, AppRailAnchor } from '@skeletonlabs/skeleton';
  import {
    CreditCardIcon,
    HomeIcon,
    LayoutDashboardIcon,
    MenuIcon,
    ReceiptIcon,
    Users2Icon,
  } from 'lucide-svelte';
  import { page } from '$app/stores';
</script>

<div class="flex flex-grow">
  <aside role="list">
    <AppRail>
      <svelte:fragment slot="lead">
        <AppRailAnchor href="/"
          ><MenuIcon class="mx-auto" size={32} /></AppRailAnchor
        >
      </svelte:fragment>
      <!-- --- -->
      <AppRailAnchor
        href="/dashboard"
        selected={$page.url.pathname === '/dashboard'}
      >
        <svelte:fragment slot="lead"
          ><LayoutDashboardIcon class="mx-auto" size={32} /></svelte:fragment
        >
        <span>Dashboard</span>
      </AppRailAnchor>
      <AppRailAnchor
        href="/dashboard/bills"
        selected={$page.url.pathname === '/dashboard/bills'}
      >
        <svelte:fragment slot="lead">
          <ReceiptIcon class="mx-auto" size={32} />
        </svelte:fragment>
        <span>Bills</span>
      </AppRailAnchor>
      <AppRailAnchor
        href="/dashboard/household"
        selected={$page.url.pathname.startsWith('/dashboard/household')}
      >
        <svelte:fragment slot="lead">
          <Users2Icon class="mx-auto" size={32} />
        </svelte:fragment>
        <span>Household</span>
      </AppRailAnchor>
      <AppRailAnchor
        href="/dashboard/payments"
        selected={$page.url.pathname.startsWith('/dashboard/payments')}
      >
        <svelte:fragment slot="lead">
          <CreditCardIcon size={32} class="mx-auto" />
        </svelte:fragment>
        <span>Payments</span>
      </AppRailAnchor>
    </AppRail>
  </aside>
  <slot />
</div>

<style>
  :global([data-theme]) {
    background-image: unset;
  }
</style>
