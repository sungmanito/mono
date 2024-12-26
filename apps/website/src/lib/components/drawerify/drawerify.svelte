<script lang="ts" module>
  export interface DrawerifyProps<
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Data,
    T extends { data: unknown; component: boolean; onclose: () => void },
  > {
    component: Component<T>;
    open: boolean;
    onopen?: () => void;
    onclose?: () => void;
    url: string;
    loading?: Snippet<[]>;
  }
</script>

<script
  lang="ts"
  generics="Data extends Record<string, any>, T extends { data: Data; component: boolean; onclose: () => void}"
>
  import { preloadData } from '$app/navigation';

  import Drawer from '$components/drawer/drawer.svelte';
  import { createQuery } from '@tanstack/svelte-query';
  import { LoaderIcon } from 'lucide-svelte';

  import type { Component, Snippet } from 'svelte';

  let {
    component,
    open = $bindable(false),
    onopen = () => void 0,
    onclose = () => void 0,
    url,
    loading,
  }: DrawerifyProps<Data, T> = $props();

  const query = $derived(
    createQuery({
      queryKey: ['drawerify', url],
      queryFn: async () => {
        const response = await preloadData(url);
        if (response.type === 'loaded' && response.status === 200) {
          return response.data as Data;
        }
      },
      staleTime: 5000,
      enabled: open,
    }),
  );

  $effect(() => {
    if (onopen && open && Object.keys($query.data || {}).length === 0) {
      onopen();
    }
  });

  $effect(() => {
    if (onopen && open && url) {
      onopen();
    }
  });
</script>

<Drawer
  bind:open
  onclose={() => {
    open = false;
    onclose();
  }}
  aria-atomic="true"
>
  {#snippet children({ close: closeDrawer })}
    {#if $query.isLoading || !$query.isSuccess}
      {#if loading}
        {@render loading()}
      {:else}
        <div class="flex items-center justify-center">
          <LoaderIcon class="animate-spin" size="3rem" />
        </div>
      {/if}
    {:else}
      {@const Component = component}
      <Component
        data={$query.data || {}}
        onclose={closeDrawer}
        component={true}
      />
    {/if}
  {/snippet}
</Drawer>
