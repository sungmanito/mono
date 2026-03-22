<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Progress from './progress.svelte';

  const today = new Date();

  const { Story } = defineMeta({
    title: 'Progress',
    component: Progress,
    tags: ['autodocs'],
    args: {
      today: new Date(),
      end: (() => {
        let td = new Date();
        td.setDate(1);
        td.setMonth(td.getMonth() + 1);
        td.setDate(0);
        return td.getDate();
      })(),
      pins: [
        {
          name: 'Bill 1',
          status: 'pending',
          date: new Date(today),
        },
        {
          name: 'Bill 2',
          status: 'paid',
          date: new Date(today),
        },
        {
          name: 'Bill 2',
          status: 'paid',
          date: new Date(today.getFullYear(), today.getMonth(), 22),
        },
        {
          name: 'First bill',
          status: 'paid',
          date: new Date(today.getFullYear(), today.getMonth(), 1),
        },
        {
          name: 'Unpaid Bill',
          status: 'pending',
          date: new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() - 1 || 1,
          ),
        },
      ],
    },
  });
</script>

<Story name="Default" args={{}} />

<Story name="Bob" />
