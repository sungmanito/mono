<script lang="ts">
  let props = $props();
  const options = Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(i);
    return d.toLocaleDateString(undefined, {
      month: 'long',
    });
  });
</script>

<select {...props}>
  {#each options as option, i (option)}
    <option value={i + 1} selected={props.value === i}>{option}</option>
  {/each}
</select>
