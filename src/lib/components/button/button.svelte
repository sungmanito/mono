<script lang="ts">
  import { cva, type VariantProps } from 'class-variance-authority';

  const button = cva(
    'btn',
    {
      variants: {
        variant: {
          filled: 'variant-filled',
          primary: 'variant-filled-primary',
          secondary: 'variant-filled-secondary',
          destructive: 'variant-filled-error',
          'primary:ghost': 'variant-ghost-primary',
        },
        size: {
          sm: 'btn-sm',
          medium: 'btn-md'
        },
        rounded: {
          DEFAULT: 'rounded-full',
          lg: 'rounded-lg',
          md: 'rounded',
          none: ''
        }
      },
      defaultVariants: {
        variant: 'primary',
        size: 'medium',
        rounded: 'DEFAULT',
      }
    },
  );

  type ButtonStyleProps = VariantProps<typeof button>;

  export let variant: ButtonStyleProps['variant'] = 'primary';
  export let size: ButtonStyleProps['size'] = 'sm';

  const className = button({ size, variant, className: $$props.class })

</script>

<button {...$$props} class={className} on:click>
  <slot />
</button>