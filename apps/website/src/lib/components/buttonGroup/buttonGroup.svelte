<script lang="ts" module>
  import { type Snippet } from 'svelte';
  import type { ClassValue } from 'svelte/elements';

  export type WithLabel = {
    label: string;
    value?: string;
    id: string;
  };

  export type ButtonGroupProps<T extends readonly WithLabel[] | string[]> = {
    children?: Snippet<[]>;
    class?: ClassValue;
    buttonSnippet?: Snippet<[{ active?: boolean }]>;
    options?: T;
    active?: T[number];
    /** @description the active class applied to the buttons
     * @default 'variant-filled-primary'
     */
    activeClass?: string;
    onchange?: (value: T[number]) => void;
  };
</script>

<script lang="ts" generics="T extends readonly WithLabel[] | string[]">
  let {
    children,
    class: className = '',
    options,
    active = $bindable(options?.[0]),
    activeClass = 'variant-filled-primary',
    onchange = () => void 0,
  }: ButtonGroupProps<T> = $props();

  const resolvedOptions = options ?? ([] as unknown as T);

  $effect(() => {
    onchange(active);
  });
</script>

{#snippet defaultButtonSnippet({
  label,
  active,
  onclick,
}: {
  label: string;
  active: boolean;
  onclick: () => void;
})}
  <button type="button" class={['btn', { [activeClass]: active }]} {onclick}>
    {label}
  </button>
{/snippet}

<div class={['btn-group', className]}>
  {#if children}
    {@render children()}
  {:else}
    {#each resolvedOptions as l}
      {#if typeof l === 'string'}
        {@render defaultButtonSnippet({
          label: l,
          active: active === l,
          onclick: () => (active = l),
        })}
      {:else}
        {@render defaultButtonSnippet({
          label: l.label,
          active: active === l.label,
          onclick: () => (active = l.label),
        })}
      {/if}
    {/each}
  {/if}
</div>
