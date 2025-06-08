<script lang="ts" module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Pill from './pill.svelte';
  const { Story } = defineMeta({
    title: 'Pill',
    component: Pill,
    tags: ['autodocs'],
  });
</script>

<Story name="Default" />
<Story name="Paid" args={{ color: 'paid' }} />
<Story name="Overdue" args={{ color: 'overdue' }} />
<Story name="Upcoming" args={{ color: 'upcoming' }} />
