<script lang="ts">
  import { cva, type VariantProps } from 'class-variance-authority';

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

  export let variant: ButtonStyleProps['variant'] = 'primary';
  export let size: ButtonStyleProps['size'] = 'sm';

  const className = button({ size, variant, className: $$props.class });
</script>

<button {...$$props} class={className} on:click>
  <slot />
</button>
