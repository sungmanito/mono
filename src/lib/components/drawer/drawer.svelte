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
  on:click={() => dispatchCloseEvent()}
  class="drawer-backdrop flex fixed top-0 bottom-0 left-0 right-0 bg-surface-backdrop-token z-50" class:hidden={!open}
  use:focusTrap={true}
>
  <div role="dialog" class="drawer bg-surface bg-surface-100-800-token shadow-xl rounded-l-xl h-full w-5/6" >
    <slot close={() => dispatchCloseEvent()} />
  </div>
</div>

