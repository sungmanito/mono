<script lang="ts">
  interface Props {
    closable?: boolean,
    variant?: string,
    icon?: import('svelte').Snippet,
    children?: import('svelte').Snippet
  }

  let {
    closable = false,
    variant = 'ghost',
    icon,
    children
  }: Props = $props();
</script>

<div class="alert variant-ghost flex justify-between">
  {@render icon?.()}
  {@render children?.()}
  {#if closable}
    <button
      class="btn btn-sm"
      onclick={() => {
        console.info('close');
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke-width="1.5"
        stroke="currentColor"
        class="w-6 h-6"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg></button
    >
  {/if}
</div>
