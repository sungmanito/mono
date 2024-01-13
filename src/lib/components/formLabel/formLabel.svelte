<script lang="ts">
  export let label: string;
  export let description: string = '';
  export let required: boolean = false;
</script>

<label class="flex flex-col gap-2">
  <span class="font-bold">{label}{#if required}&nbsp;*{/if}</span>
  <slot />
  {#if description}
    <span class="text-sm">{description}</span>
  {/if}
</label>
