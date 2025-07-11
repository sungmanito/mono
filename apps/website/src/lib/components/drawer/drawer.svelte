<script lang="ts" module>
  export interface DrawerProps
    extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    open: boolean;
    onclose?: () => void;
    onopen?: () => void;
    children: Snippet<[{ close: () => void }]>;
    from?: 'left' | 'right' | 'top' | 'bottom';
  }
</script>

<script lang="ts">
  import { focusTrap } from '@skeletonlabs/skeleton';
  import { cx } from 'class-variance-authority';
  import { type Snippet, untrack } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  let {
    open = $bindable(false),
    onclose = () => void 0,
    onopen = () => void 0,
    children,
    class: propClass,
    ...rest
  }: DrawerProps = $props();

  function dispatchCloseEvent() {
    open = false;
    onclose();
  }

  function dispatchOpenEvent() {
    open = true;
    onopen();
  }

  let classNames = cx(
    'drawer bg-surface-100-800-token shadow-xl rounded-r-xl h-full w-5/6 overflow-auto',
    propClass,
  );

  $effect(() => {
    if (open) {
      untrack(() => dispatchOpenEvent());
    }
  });
</script>

<svelte:window
  onkeyup={(e) => {
    if (e.key === 'Escape') dispatchCloseEvent();
  }}
/>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  onclick={(e) => (e.currentTarget === e.target ? dispatchCloseEvent() : null)}
  class={[
    'drawer-backdrop flex fixed top-0 bottom-0 left-0 right-0 bg-surface-backdrop-token z-50',
    { hidden: !open },
  ]}
  use:focusTrap={true}
>
  <div role="dialog" class={classNames} {...rest}>
    {@render children({ close: () => dispatchCloseEvent() })}
  </div>
</div>

<style>
  @keyframes slide-in {
    0% {
      translate: -10% 0;
      opacity: 0.75;
    }
    100% {
      translate: 0 0;
      opacity: 1;
    }
  }
  .drawer {
    animation: slide-in;
    animation-duration: 200ms;
    animation-iteration-count: 1;
  }
  @keyframes slide-out {
    0% {
      translate: 0 0;
      opacity: 1;
    }
    100% {
      translate: -10% 0;
      opacity: 0.75;
    }
  }
</style>
