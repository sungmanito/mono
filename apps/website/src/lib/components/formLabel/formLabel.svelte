<script lang="ts">
  export let label: string;
  export let description: string = '';
  export let required: boolean = false;
</script>

<label class="flex flex-col gap-2">
  <span class="font-bold"
    >{label}{#if required}&nbsp;*{/if}</span
  >
  <slot />
  {#if description}
    <span class="text-sm">{description}</span>
  {/if}
  {#if $$slots.error}
    <span class="error-text">
      <slot name="error" />
    </span>
  {/if}
</label>

<style>
  label .error-text {
    display: none;
    color: theme('colors.red.300');
  }
  label:has(:invalid) .error-text {
    display: block;
  }
</style>
