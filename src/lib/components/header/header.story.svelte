<script lang="ts">
  import type { Hst } from '@histoire/plugin-svelte';
  import Header from './header.svelte';
  export let Hst: Hst

  const tags = Array.from({ length: 6}, (_, i) => `h${i+1}`);
  const colorOptions = ['primary', 'secondary'];
  let color = 'primary';
  let content = '';
</script>

<Hst.Story>
  {#each tags as tag, i}
    <Hst.Variant  title={tag}>

      <Header tag={tag} color="primary">
        {#if content === ''}
          Header {i+1}
        {:else}
          {content}
        {/if}
      </Header>
      <svelte:fragment slot="controls">
        <input type="text" bind:value={content}>
        <select bind:value={color}>
          {#each colorOptions as option}
            <option value={option}>{option}</option>
          {/each}
        </select>
      </svelte:fragment>
    </Hst.Variant>
  {/each}
</Hst.Story>
