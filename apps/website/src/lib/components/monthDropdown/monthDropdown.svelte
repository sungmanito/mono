<script context="module" lang="ts">
</script>

<script lang="ts">
  interface Props { [key: string]: any }

  let { value, onchange, ...rest }: Props = $props();
  const options = $state(Array.from({ length: 12 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(i);
    return d.toLocaleDateString(undefined, {
      month: 'long',
    });
  }));
</script>

<select {...rest} {onchange}>
  {#each options as option, i (option)}
    <option value={i + 1} selected={value === i}>{option}</option>
  {/each}
</select>
