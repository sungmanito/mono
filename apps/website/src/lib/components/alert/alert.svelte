<script lang="ts" module>
  import { cva, type VariantProps } from 'class-variance-authority';
  import { type Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';

  const variants = cva('alert', {
    variants: {
      type: {
        primary: 'variant-filled-primary',
        error: 'variant-filled-error',
        default: 'variant-filled',
        surface: 'variant-filled-surface',
        warning: 'variant-filled-warning',
        success: 'variant-filled-success',
        'primary:ghost': 'variant-ghost-primary',
        'error:ghost': 'variant-ghost-error',
        'surface:ghost': 'variant-ghost-surface',
        'warning:ghost': 'variant-ghost-warning',
        'success:ghost': 'variant-ghost-success',
      },
    },
    defaultVariants: {
      type: 'default',
    },
  });

  export type VariantTypes = VariantProps<typeof variants>;

  export interface AlertProps extends HTMLAttributes<HTMLElement> {
    children: Snippet<[]>;
    actions?: Snippet<[]>;
  }
</script>

<script lang="ts">
  let {
    children,
    actions,
    type = 'default',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    class: className,
    ...rest
  }: AlertProps & VariantTypes = $props();
  let classes = $derived(variants({ type }));
</script>

<div class={classes} {...rest}>
  <div class="alert-message">
    {@render children()}
  </div>
  {#if actions}
    <div class="alert-actions">
      {@render actions()}
    </div>
  {/if}
</div>
