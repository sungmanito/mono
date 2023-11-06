<script lang="ts">
  import { cva, type VariantProps } from 'class-variance-authority';

  const headers = cva(
    'mb-2',
    {
      variants: {
        tag: {
          h1: 'text-4xl font-bold',
          h2: 'text-3xl font-semibold',
          h3: 'text-2xl font-bold',
          h4: 'text-2xl font-semibold underline',
          h5: 'text-xl font-semibold',
          h6: 'text-xl font-medium italic'
        },
        color: {
          primary: 'dark:text-emerald-400 text-emerald-800',
          secondary: 'dark:text-slate-200 text-slate-700'
        }
      },
      defaultVariants: {
        tag: 'h1',
        color: 'primary',
      }
    }
  );

  type VariantValues = VariantProps<typeof headers>;

  export let tag: VariantValues['tag'] = 'h1';
  export let color: VariantValues['color'] = 'primary'

  const classes = headers({ tag, color, class: $$restProps.class });
</script>

<svelte:element this={tag} class="flex justify-between items-baseline">
  <div class={classes}>
    <slot />
  </div>
  <section class="actions inline-flex gap-2">
    <slot name="actions" />
  </section>
</svelte:element>
