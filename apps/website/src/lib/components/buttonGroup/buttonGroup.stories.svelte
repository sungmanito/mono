<script lang="ts" module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import ButtonGroup from './buttonGroup.svelte';

  const { Story } = defineMeta({
    title: 'Components/ButtonGroup',
    component: ButtonGroup,
  });
</script>

<Story name="Default" />
