<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import { focusTrap } from "@skeletonlabs/skeleton";
  export let open = false;
  const dispatch = createEventDispatcher();
  function dispatchCloseEvent() {
    dispatch('close');
  }
</script>

<svelte:window on:keyup={e => {
  if(e.key === 'Escape') dispatchCloseEvent();
}} />

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  on:click={(e) => e.currentTarget === e.target ? dispatchCloseEvent() : null}
  class="drawer-backdrop flex fixed top-0 bottom-0 left-0 right-0 bg-surface-backdrop-token z-50" class:hidden={!open}
  use:focusTrap={true}
>
  <div role="dialog" class="drawer bg-surface-100-800-token shadow-xl rounded-r-xl h-full w-5/6" >
    <slot close={() => dispatchCloseEvent()} />
  </div>
</div>

<style>
  @keyframes slide-in {
    0% {
      translate: -10% 0;
      opacity: 0.75
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