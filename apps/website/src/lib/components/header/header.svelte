<script lang="ts" module>
  import { cva, type VariantProps } from 'class-variance-authority';
  import type { Snippet } from 'svelte';

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
  export interface HeaderProps {
    /** @description the HTML tag you want rendered for this item */
    tag?: VariantValues['tag'];
    color?: VariantValues['color'];
    /** @description gets appended to the values for the wrapping header element */
    class?: string;
    /** @description applies to element rendered by the tag property */
    tagClasses?: string;
    children: Snippet<[]>;
    actions?: Snippet<[]>;
  }
</script>

<script lang="ts">
  let {
    tag = 'h1',
    color = 'primary',
    class: className,
    children,
    actions,
    tagClasses = '',
  }: HeaderProps = $props();

  const classes = headers({ tag, color, class: className });
</script>

<div class={['flex justify-between items-baseline', tagClasses]}>
  <svelte:element this={tag} class={classes}>
    {@render children()}
  </svelte:element>
  {#if actions}
    <section class="actions inline-flex gap-2">
      {@render actions()}
    </section>
  {/if}
</div>
