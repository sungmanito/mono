<script lang="ts" module>
  export type PillProps = {
    color?: 'pending' | 'paid' | 'overdue' | 'upcoming';
    display: 'block' | 'inline';
    class?: ClassValue;
  };
</script>

<script lang="ts">
  import { type ClassValue } from 'svelte/elements';

  let { color = 'pending', display = 'inline' }: PillProps = $props();

  let colorClass = $derived(
    color === 'pending'
      ? 'bg-yellow-100 text-yellow-700'
      : color === 'paid'
        ? 'bg-green-100 text-green-700'
        : color === 'overdue'
          ? 'bg-red-100 text-red-700'
          : color === 'upcoming'
            ? 'bg-blue-100 text-blue-700'
            : '',
  );

  let label = $derived(
    color === 'pending'
      ? 'Pending'
      : color === 'paid'
        ? 'Paid'
        : color === 'overdue'
          ? 'Overdue'
          : color === 'upcoming'
            ? 'Upcoming'
            : '',
  );
</script>

<div
  class={[
    'px-2 py-1 rounded-full text-xs font-semibold',
    colorClass,
    { display, 'inline-block': display === 'inline' },
  ]}
>
  {label}
</div>
