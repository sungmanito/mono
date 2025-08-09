<script lang="ts">
  import { page } from '$app/state';
  import { queryClient } from '$lib/client/svelte-query';
  import {
    arrow,
    autoUpdate,
    computePosition,
    flip,
    offset,
    shift,
  } from '@floating-ui/dom';
  import { AppRail, AppRailAnchor } from '@skeletonlabs/skeleton';
  import { QueryClientProvider } from '@tanstack/svelte-query';
  import {
    CreditCardIcon,
    LayoutDashboardIcon,
    MenuIcon,
    ReceiptIcon,
    Users2Icon,
  } from 'lucide-svelte';

  import { storePopup } from '@skeletonlabs/skeleton';
  storePopup.set({ computePosition, autoUpdate, offset, shift, flip, arrow });
</script>

<QueryClientProvider client={queryClient}>
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
          selected={page.url.pathname === '/dashboard'}
        >
          <svelte:fragment slot="lead"
            ><LayoutDashboardIcon class="mx-auto" size={32} /></svelte:fragment
          >
          <span>Dashboard</span>
        </AppRailAnchor>
        <AppRailAnchor
          href="/dashboard/bills"
          selected={page.url.pathname === '/dashboard/bills'}
        >
          <svelte:fragment slot="lead">
            <ReceiptIcon class="mx-auto" size={32} />
          </svelte:fragment>
          <span>Bills</span>
        </AppRailAnchor>
        <AppRailAnchor
          href="/dashboard/household"
          selected={page.url.pathname.startsWith('/dashboard/household')}
        >
          <svelte:fragment slot="lead">
            <Users2Icon class="mx-auto" size={32} />
          </svelte:fragment>
          <span>Household</span>
        </AppRailAnchor>
        <AppRailAnchor
          href="/dashboard/payments"
          selected={page.url.pathname.startsWith('/dashboard/payments')}
        >
          <svelte:fragment slot="lead">
            <CreditCardIcon size={32} class="mx-auto" />
          </svelte:fragment>
          <span>Payments</span>
        </AppRailAnchor>
      </AppRail>
    </aside>
    <svelte:boundary>
      {#snippet pending()}
        Loading...
      {/snippet}
      {#snippet failed(_, reset)}
        <div class="container mx-auto mt-8">
          <div class="alert variant-ghost-error">
            <div class="alert-message">
              We've encountered an error while switching pages. Please wait a
              second and click the reset button to try again.
              <p>We are actively working to resolve this problem.</p>
            </div>
            <div class="alert-actions">
              <button class="btn variant-filled-error" onclick={reset}>
                Retry
              </button>
            </div>
          </div>
        </div>
      {/snippet}
      <slot />
    </svelte:boundary>
  </div>
</QueryClientProvider>
