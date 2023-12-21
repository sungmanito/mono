<script lang="ts">
  export let label: string;
</script>

<label class="flex flex-col gap-2">
  <span class="font-bold">{label}</span>
  <slot />
</label>
