<script lang="ts" module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import FormLabel from './formLabel.svelte';
  const { Story } = defineMeta({
    title: 'Form Label',
    tags: ['autodocs'],
    component: FormLabel,
  });
</script>

{#snippet defaultChild()}
  <input placeholder="Username" type="email" required />
{/snippet}

{#snippet errorChild()}
  I am the error
{/snippet}

<Story name="Default" args={{ label: 'Form Field', children: defaultChild }} />

<Story
  name="With Error"
  args={{ label: 'With Error', error: errorChild, children: defaultChild }}
/>

<Story
  name="With Required"
  args={{ label: 'With Required', required: true, children: defaultChild }}
/>
