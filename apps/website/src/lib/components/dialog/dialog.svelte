<script lang="ts">
  interface Props { open?: boolean, children?: import('svelte').Snippet }

  let { open = false, children }: Props = $props();
</script>

<dialog
  {open}
  class="p-4 rounded bg-surface-active-token shadow backdrop:bg-gray-800/30"
>
  {@render children?.()}
</dialog>
