<script lang="ts">
  import type { HTMLImgAttributes } from 'svelte/elements';
  import { onMount } from 'svelte';

  // eslint-disable-next-line
  interface $$Props extends HTMLImgAttributes {
    placeholderClass?: string;
  }

  let loaded = false;

  onMount(() => {
    const img = new Image();
    img.src = $$props.src;
    img.addEventListener('load', () => {
      loaded = true;
    });
  });
</script>

{#if !loaded}
  <div
    class={`placeholder animate-pulse ${$$props.placeholderClass || ''}`}
  ></div>
{:else}
  <!-- svelte-ignore a11y-missing-attribute -->
  <img {...$$restProps} />
{/if}
