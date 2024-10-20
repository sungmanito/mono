<script lang="ts">
  interface Props {
    label: string,
    description?: string,
    required?: boolean,
    children?: import('svelte').Snippet,
    error?: import('svelte').Snippet
  }

  let {
    label,
    description = '',
    required = false,
    children,
    error
  }: Props = $props();
</script>

<label class="flex flex-col gap-2">
  <span class="font-bold"
    >{label}{#if required}&nbsp;*{/if}</span
  >
  {@render children?.()}
  {#if description}
    <span class="text-sm">{description}</span>
  {/if}
  {#if $$slots.error}
    <span class="error-text">
      {@render error?.()}
    </span>
  {/if}
</label>

<style>
  label .error-text {
    display: none;
    color: theme('colors.red.300');
  }
  label:has(:invalid) .error-text {
    display: block;
  }
</style>
