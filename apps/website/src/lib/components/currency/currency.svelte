<script lang="ts" module>
  import type { HTMLSelectAttributes } from 'svelte/elements';
  export interface CurrencyProps extends HTMLSelectAttributes {
    selected?: string;
  }
</script>

<script lang="ts">
  const currencies = Intl.supportedValuesOf('currency');
  let { selected = 'USD', ...rest } = $props();
</script>

<select class="select" {...rest}>
  {#each currencies as currency}
    <option value={currency} selected={selected === currency}>{currency}</option
    >
  {/each}
</select>
