<script lang="ts" module>
  import type { ClassValue } from 'svelte/elements';
  export interface SlotProps {
    open: boolean;
    toggle: () => void;
  }
  export interface ExpandableProps {
    open?: boolean;
    children?: Snippet<[SlotProps]>;
    header?: Snippet<[SlotProps]>;
    headerContainerTag?: string;
    headerContainerClasses?: ClassValue;
    class?: ClassValue;
    disableExpandButton?: boolean;
    /** @description Used when want the child snippet to always be in the dom, but toggle its visibility */
    hideInstead?: boolean;
  }
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import { ChevronDownIcon } from 'lucide-svelte';

  let {
    open = $bindable(false),
    children,
    header,
    headerContainerTag = 'header',
    headerContainerClasses = ['flex justify-between mb-4'],
    class: classProp,
    disableExpandButton = false,
    hideInstead = false,
  }: ExpandableProps = $props();

  function toggleOpen() {
    open = !open;
  }
  /**
   * Determine whether or not we want to have the contents slide out like the accordions
   * Good to go for now
   */
</script>

<div class={['expandable', classProp]}>
  <svelte:element this={headerContainerTag} class={headerContainerClasses}>
    {#if header}
      {@render header({ open, toggle: toggleOpen })}
    {/if}
    {#if !disableExpandButton}
      <button onclick={toggleOpen} type="button">
        <ChevronDownIcon class={open ? 'rotate-180' : undefined} />
      </button>
    {/if}
  </svelte:element>

  {#if children && open && !hideInstead}
    {@render children({ open, toggle: toggleOpen })}
  {:else if children && hideInstead}
    <div class={{ hidden: !open, contents: open }}>
      {@render children({ open, toggle: toggleOpen })}
    </div>
  {/if}
</div>
