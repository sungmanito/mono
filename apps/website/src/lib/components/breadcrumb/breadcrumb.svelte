<script lang="ts" module>
  import type { HTMLAttributes } from 'svelte/elements';
  export interface BreadcrumbProps
    extends Omit<HTMLAttributes<HTMLOListElement>, 'children'> {
    crumbs: BreadcrumbEntry[];
  }
</script>

<script lang="ts">
  import type { BreadcrumbEntry } from './types';
  import { cx } from 'class-variance-authority';
  let { crumbs = [], ...rest }: BreadcrumbProps = $props();
</script>

<ol {...rest} class={cx('breadcrumb', rest.class)}>
  {#each crumbs as crumb, i}
    {#if i < crumbs.length - 1}
      <li class="crumb">
        <a class="anchor" href={crumb.href}>{crumb.link}</a>
      </li>
      <li class="crumb-separator" aria-hidden="true">&rsaquo;</li>
    {:else}
      <li class="crumb">
        {crumb.link}
      </li>
    {/if}
  {/each}
</ol>
