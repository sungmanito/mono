<script lang="ts" module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import EmojiSelector from './emojiSelector.svelte';
  const { Story } = defineMeta({
    title: 'Components/EmojiSelector',
    component: EmojiSelector,
    tags: ['autodocs'],
  });
</script>

<Story name="Default" />
