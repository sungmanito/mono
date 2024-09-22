<script context="module" lang="ts">
</script>

<script lang="ts">
  export let value: number;
  const options = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(i);
    return d.toLocaleDateString(undefined, {
      month: 'long',
    });
  });
</script>

<select {...$$restProps} on:change>
  {#each options as option, i (option)}
    <option value={i + 1} selected={value === i}>{option}</option>
  {/each}
</select>
