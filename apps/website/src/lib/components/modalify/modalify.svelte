<script
  lang="ts"
  generics="Data extends Record<string, any>, T extends { data: unknown; component: boolean; onclose: () => void}"
>
  import { run } from 'svelte/legacy';

  import { preloadData } from '$app/navigation';
  import Modal from '$components/modal/modal.svelte';
  import { createQuery } from '@tanstack/svelte-query';
  import { LoaderIcon } from 'lucide-svelte';

  import type { SvelteComponent } from 'svelte';
  import { createEventDispatcher } from 'svelte';


  interface Props {
    component: typeof SvelteComponent<T>,
    open?: boolean,
    url: string,
    header?: import('svelte').Snippet<[any]>,
    loading?: import('svelte').Snippet
  }

  let {
    component,
    open = $bindable(false),
    url,
    header,
    loading
  }: Props = $props();

  let data = {} as Data;

  const dispatcher = createEventDispatcher();

  let query = $derived(createQuery({
    queryKey: ['modalify', url],
    queryFn: async () => {
      const response = await preloadData(url);

      if (response.type === 'loaded' && response.status === 200) {
        return response.data as Data;
      }
    },
    staleTime: 5000,
    enabled: open,
  }));

  run(() => {
    if (open && Object.keys(data).length === 0) {
      dispatcher('open');
    }
  });

  run(() => {
    if (open && url) {
      dispatcher('open');
    }
  });
</script>

<Modal
  {open}
  on:close={() => {
    open = false;
    dispatcher('close');
  }}
  let:close={closeModal}
>
  <svelte:fragment slot="header">
    {@render header?.({ data: {$query.data}, })}
  </svelte:fragment>
  {#if $query.isLoading || !$query.isSuccess}
    {#if loading}{@render loading()}{:else}
      <div class="flex items-center justify-center">
        <LoaderIcon class="animate-spin" size="3rem" />
      </div>
    {/if}
  {:else}
    <svelte:component
      this={component}
      data={$query.data || {}}
      onclose={closeModal}
      component={true}
    />
  {/if}
</Modal>
