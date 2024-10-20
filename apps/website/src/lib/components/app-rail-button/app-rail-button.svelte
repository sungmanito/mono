<script>
  /** @type {{children?: import('svelte').Snippet}} */
  let { children } = $props();
</script>

<div
  class="app-rail-wrapper w-full flex flex-col justify-center items-stretch text-center space-y-1 aspect-square bg-primary-hover-token space-y-1 bg-primary-active-token"
>
  {@render children?.()}
</div>
