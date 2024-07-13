<script lang="ts">
  import { page } from '$app/stores';
  import { AppRail, AppRailAnchor } from '@skeletonlabs/skeleton';
  import {
    CreditCardIcon,
    LayoutDashboardIcon,
    MenuIcon,
    ReceiptIcon,
    Users2Icon,
  } from 'lucide-svelte';
  let { class: className = '' } = $$props;
</script>

<AppRail class={className}>
  <svelte:fragment slot="lead">
    <div class="flex justify-center items-center p-4 md:hidden">
      <button
        popovertarget="side-menu"
        popovertargetaction="hide"
        aria-label="Close menu"
      >
        <MenuIcon class="mx-auto" size={32} />
      </button>
    </div>
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
    selected={$page.url.pathname.startsWith('/dashboard/bills')}
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
