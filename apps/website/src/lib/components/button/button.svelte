<script lang="ts" module>
  import type { HTMLButtonAttributes } from 'svelte/elements';
  const button = cva('btn', {
    variants: {
      variant: {
        filled: 'variant-filled',
        primary: 'variant-filled-primary',
        secondary: 'variant-filled-secondary',
        destructive: 'variant-filled-error',
        'primary:ghost': 'variant-ghost-primary',
        'destructive:ghost': 'variant-ghost-error',
        'scondary:ghost': 'variant-ghost-secondary',
        // Escape hatch, in case we need to get really weird with the buttons
        custom: '',
      },
      size: {
        sm: 'btn-sm',
        md: 'btn-md',
        lg: 'btn-lg',
        // Escape hatch.
        custom: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  });

  type ButtonStyleProps = VariantProps<typeof button>;

  export interface ButtonProps extends HTMLButtonAttributes {
    variant?: ButtonStyleProps['variant'];
    size?: ButtonStyleProps['size'];
  }
</script>

<script lang="ts">
  import { cva, type VariantProps } from 'class-variance-authority';

  let {
    variant = 'primary',
    size = 'sm',
    class: classProp,
    children,
    ...rest
  }: ButtonProps = $props();

  // export let variant: ButtonStyleProps['variant'] = 'primary';
  // export let size: ButtonStyleProps['size'] = 'sm';

  const className = $derived(button({ size, variant, className: classProp }));
</script>

<!-- svelte-ignore a11y_consider_explicit_label -->
<button {...rest} class={className}>
  {@render children?.()}
</button>
