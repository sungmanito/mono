<script lang="ts">
  import { cva, type VariantProps } from 'class-variance-authority';

  const headers = cva('mb-2', {
    variants: {
      tag: {
        h1: 'h1',
        h2: 'h2',
        h3: 'h3',
        h4: 'h4',
        h5: 'h5',
        h6: 'h6',
      },
      color: {
        primary: 'dark:text-emerald-400 text-emerald-800',
        secondary: 'dark:text-slate-200 text-slate-700',
      },
    },
    defaultVariants: {
      tag: 'h1',
      color: 'primary',
    },
  });

  type VariantValues = VariantProps<typeof headers>;

  export let tag: VariantValues['tag'] = 'h1';
  export let color: VariantValues['color'] = 'primary';

  const classes = headers({ tag, color, class: $$restProps.class });
</script>

<div class="flex justify-between items-baseline">
  <svelte:element this={tag} class={classes}>
    <slot />
  </svelte:element>
  <section class="actions inline-flex gap-2">
    <slot name="actions" />
  </section>
</div>
