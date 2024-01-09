<script lang="ts">
  import type { BreadcrumbEntry } from './types';
  import { cx } from 'class-variance-authority';
  export let crumbs: BreadcrumbEntry[] = [];
</script>

<ol {...$$props} class={cx('breadcrumb', $$props.class)}>
  {#each crumbs as crumb, i}
    {#if i < crumbs.length - 1}
      <li class="crumb">
        <a class="anchor" href={crumb.href}>{crumb.link}</a>
      </li>
      <li class="crumb-separator" aria-hidden>&rsaquo;</li>
    {:else}
      <li class="crumb">
        {crumb.link}
      </li>
    {/if}
  {/each}
</ol>
