<script lang="ts" module>
  import type { Snippet } from 'svelte';
  import type { Placement } from '@floating-ui/dom';

  export type TooltipProps = {
    trigger: Snippet<[string]>;
    content: Snippet<[string]>;
    placement?: Placement;
    class?: ClassValue;
  };
</script>

<script lang="ts">
  import { computePosition, autoUpdate, flip, offset } from '@floating-ui/dom';
  import type { ClassValue } from 'svelte/elements';

  let {
    content,
    trigger,
    placement = 'bottom',
    class: className,
  }: TooltipProps = $props();

  const id = $props.id();

  const supportsAnchorPositioning =
    typeof CSS !== 'undefined' && CSS.supports('position-anchor', '--foo');

  let triggerEl = $state<HTMLElement | undefined>();
  let tooltipEl = $state<HTMLElement | undefined>();
  let hideTimer: ReturnType<typeof setTimeout> | undefined;

  const show = () => {
    clearTimeout(hideTimer);
    if (!tooltipEl?.matches(':popover-open')) tooltipEl?.showPopover();
  };

  const hide = () => {
    hideTimer = setTimeout(() => tooltipEl?.hidePopover(), 100);
  };

  $effect(() => {
    if (supportsAnchorPositioning || !triggerEl || !tooltipEl) return;

    return autoUpdate(triggerEl, tooltipEl, async () => {
      if (!triggerEl || !tooltipEl) return;
      const { x, y } = await computePosition(triggerEl, tooltipEl, {
        placement,
        middleware: [flip(), offset(8)],
      });
      Object.assign(tooltipEl.style, {
        left: `${x}px`,
        top: `${y}px`,
      });
    });
  });
</script>

<span
  bind:this={triggerEl}
  style="anchor-name: --{id}"
  onmouseenter={show}
  onmouseleave={hide}
  onfocusin={show}
  onfocusout={hide}
  class={className}
>
  {@render trigger(id)}
</span>

<div
  class="tooltip bg-surface-active-token p-3 rounded"
  role="tooltip"
  popover="manual"
  {id}
  data-placement={placement}
  style="position-anchor: --{id}"
  bind:this={tooltipEl}
  onmouseenter={show}
  onmouseleave={hide}
>
  {#if content}
    {@render content(id)}
  {/if}
</div>

<style>
  span {
    display: inline-block;
  }

  /* Floating UI fallback: fixed position, coordinates set via JS */
  .tooltip[popover] {
    inset: unset;
    margin: unset;
    position: fixed;
  }

  /* CSS Anchor Positioning when supported — placement mapped via data-placement */
  @supports (position-anchor: --foo) {
    .tooltip[popover] {
      position: absolute;
    }

    /* bottom */
    .tooltip[popover][data-placement^='bottom'] {
      top: anchor(bottom);
      justify-self: anchor-center;
      position-try: flip-block;
    }
    .tooltip[popover][data-placement='bottom-start'] {
      justify-self: start;
    }
    .tooltip[popover][data-placement='bottom-end'] {
      justify-self: end;
    }

    /* top */
    .tooltip[popover][data-placement^='top'] {
      bottom: anchor(top);
      justify-self: anchor-center;
      position-try: flip-block;
    }
    .tooltip[popover][data-placement='top-start'] {
      justify-self: start;
    }
    .tooltip[popover][data-placement='top-end'] {
      justify-self: end;
    }

    /* right */
    .tooltip[popover][data-placement^='right'] {
      left: anchor(right);
      align-self: anchor-center;
      position-try: flip-inline;
    }
    .tooltip[popover][data-placement='right-start'] {
      align-self: start;
    }
    .tooltip[popover][data-placement='right-end'] {
      align-self: end;
    }

    /* left */
    .tooltip[popover][data-placement^='left'] {
      right: anchor(left);
      align-self: anchor-center;
      position-try: flip-inline;
    }
    .tooltip[popover][data-placement='left-start'] {
      align-self: start;
    }
    .tooltip[popover][data-placement='left-end'] {
      align-self: end;
    }
  }
</style>
