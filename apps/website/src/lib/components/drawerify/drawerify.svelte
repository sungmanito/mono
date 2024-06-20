<script
  lang="ts"
  generics="Data extends Record<string, any>, T extends { data: unknown; component: boolean; onclose: () => void}"
>
  import { preloadData } from '$app/navigation';

  import Drawer from '$components/drawer/drawer.svelte';
  import { createQuery } from '@tanstack/svelte-query';
  import { LoaderIcon } from 'lucide-svelte';

  import type { SvelteComponent } from 'svelte';
  import { createEventDispatcher } from 'svelte';

  export let component: typeof SvelteComponent<T>;
  export let open = false;
  export let url: string;

  let data = {} as Data;

  const dispatcher = createEventDispatcher();

  $: query = createQuery({
    queryKey: ['drawerify', url],
    queryFn: async () => {
      const response = await preloadData(url);
      if (response.type === 'loaded' && response.status === 200) {
        return response.data as Data;
      }
    },
    staleTime: 5000,
    enabled: open,
  });

  $: if (open && Object.keys(data).length === 0) {
    dispatcher('open');
  }

  $: if (open && url) {
    dispatcher('open');
  }
</script>

<Drawer
  {open}
  on:close={() => {
    open = false;
    dispatcher('close');
  }}
  let:close={closeDrawer}
>
  {#if $query.isLoading || !$query.isSuccess}
    <slot name="loading">
      <div class="flex items-center justify-center">
        <LoaderIcon class="animate-spin" size="3rem" />
      </div>
    </slot>
  {:else}
    <svelte:component
      this={component}
      data={$query.data || {}}
      onclose={closeDrawer}
      component={true}
    />
  {/if}
</Drawer>
