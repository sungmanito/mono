<script lang="ts" module>
  export interface ModalifyProps<
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
    header?: Snippet<[{ data: Data | undefined; close: () => void }]>;
    footer?: Snippet<[{ data: Data | undefined; close: () => void }]>;
  }
</script>

<script
  lang="ts"
  generics="Data extends Record<string, any>, T extends { data: unknown; component: boolean; onclose: () => void}"
>
  import { preloadData } from '$app/navigation';
  import Modal from '$components/modal/modal.svelte';
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
    header: modalifyHeader,
    footer,
  }: ModalifyProps<Data, T> = $props();

  let data = {} as Data;

  const query = $derived(
    createQuery({
      queryKey: ['modalify', url],
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
    if (open && Object.keys(data).length === 0) {
      onopen();
    }
  });

  $effect(() => {
    if (open && url) {
      onopen();
    }
  });
</script>

<Modal
  {open}
  onclose={() => {
    open = false;
    onclose();
  }}
>
  {#snippet header({ close: closeModal })}
    {#if modalifyHeader}
      {@render modalifyHeader({ data: $query.data, close: closeModal })}
    {/if}
  {/snippet}
  {#snippet children({ close: closeModal })}
    {#if $query.isLoading || !$query.isSuccess}
      {#if loading}{:else}
        <div class="flex items-center justify-center">
          <LoaderIcon class="animate-spin" size="3rem" />
        </div>
      {/if}
    {:else}
      {@const Component = component}
      <Component
        data={$query.data || { payments: { bill: {} } }}
        onclose={closeModal}
        component={true}
      />
    {/if}
  {/snippet}
</Modal>
