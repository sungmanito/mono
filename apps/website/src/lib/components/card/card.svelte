<script lang="ts" module>
  import type { Snippet } from 'svelte';
  import type { ClassValue } from 'svelte/elements';

  export type CardProps = {
    header?: Snippet<[]>;
    footer?: Snippet<[]>;
    children?: Snippet<[]>;
    headerClasses?: ClassValue;
    footerClasses?: ClassValue;
    class?: ClassValue;
    overrideClasses?: {
      header?: boolean;
      footer?: boolean;
    };
  };
</script>

<script lang="ts">
  let {
    header,
    footer,
    children,
    class: classValue,
    headerClasses = '',
    footerClasses = '',
    overrideClasses = {
      header: false,
      footer: false,
    },
  }: CardProps = $props();
</script>

<div class={['card', classValue]}>
  {#if header}
    <div class={[{ 'card-header': !overrideClasses.header }, headerClasses]}>
      {@render header()}
    </div>
  {/if}
  {#if children}
    {@render children()}
  {/if}
  {#if footer}
    <div class={[{ 'card-footer': !overrideClasses.footer }, footerClasses]}>
      {@render footer()}
    </div>
  {/if}
</div>
