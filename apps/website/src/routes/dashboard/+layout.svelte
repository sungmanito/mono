<script lang="ts">
  import NavRail from '$components/navrail/navrail.svelte';
  import { queryClient } from '$lib/client/svelte-query';
  import { QueryClientProvider } from '@tanstack/svelte-query';
</script>

<QueryClientProvider client={queryClient}>
  <div class="flex flex-grow">
    <aside popover id="side-menu">
      <NavRail class="flex-shrink-0" />
    </aside>
    <slot />
  </div>
</QueryClientProvider>

<style lang="scss">
  :global([data-theme]) {
    background-image: unset;
  }
  #side-menu {
    margin: 0;
    height: 100dvh;
    padding: 0;
    color: var(--token-color);
    translate: translateX(-100%);
    transition: translate 0.2s ease-in-out;
    &:popover-open {
      translate: translateX(0);
      &::backdrop {
        background-color: rgba(0, 0, 0, 0.5);
      }
    }
  }
</style>
