<script lang="ts" module>
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  export interface FormLabelProps
    extends Omit<HTMLAttributes<HTMLLabelElement>, 'children'> {
    label: string | Snippet<[]>;
    description?: string;
    required?: boolean;
    error?: Snippet<[]>;
    children?: Snippet<[]>;
  }
</script>

<script lang="ts">
  let {
    label,
    description,
    required,
    children,
    error,
    ...rest
  }: FormLabelProps = $props();
</script>

<label {...rest} class="flex flex-col gap-2">
  {#if typeof label === 'string'}
    <span class="font-bold">
      {label}{#if required}&nbsp;*{/if}
    </span>
  {:else}
    {@render label()}
  {/if}
  {@render children?.()}
  {#if description}
    <span class="text-sm">{description}</span>
  {/if}
  {#if error}
    <span class="error-text">
      {@render error()}
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
