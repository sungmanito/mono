<script lang="ts" module>
  export type EmojiSelectorProps = {
    onselect?: (emoji: string) => void;
  };
</script>

<script lang="ts">
  // Helper to generate emoji from unicode ranges
  function getEmojiRange(start: number, end: number): string[] {
    const arr: string[] = [];
    for (let i = start; i <= end; i++) {
      if (/\p{Emoji}/u.test(String.fromCodePoint(i)))
        arr.push(String.fromCodePoint(i));
    }
    return arr;
  }

  // Main emoji ranges (see Unicode Consortium)
  const emojiRanges: [number, number][] = [
    [0x1f600, 0x1f64f], // Emoticons
    [0x1f300, 0x1f5ff], // Misc Symbols & Pictographs
    [0x1f680, 0x1f6ff], // Transport & Map
    [0x1f700, 0x1f77f], // Alchemical Symbols (some emoji)
    [0x1f780, 0x1f7ff], // Geometric Shapes Extended
    [0x1f800, 0x1f8ff], // Supplemental Arrows-C (some emoji)
    [0x1f900, 0x1f9ff], // Supplemental Symbols & Pictographs
    [0x1fa70, 0x1faff], // Symbols & Pictographs Extended-A
    [0x2600, 0x26ff], // Misc Symbols
    [0x2700, 0x27bf], // Dingbats
    [0x2300, 0x23ff], // Misc Technical (some emoji)
    [0x1f1e6, 0x1f1ff], // Regional Indicator Symbols (flags)
  ];

  const emojis: string[] = [];
  for (const [start, end] of emojiRanges) {
    emojis.push(...getEmojiRange(start, end));
  }

  let { onselect }: EmojiSelectorProps = $props();

  let selected = $state('');
  let open = $state(false);

  function selectEmoji(emoji: string) {
    if (selected === emoji) selected = '';
    else selected = emoji;
    open = false;
    onselect?.(emoji);
  }
</script>

<div class="emoji-selector">
  {#if selected && !open}
    <div class="selected-emoji">{selected}</div>
  {/if}

  {#if open}
    {#each emojis as emoji}
      <button
        class="emoji {selected === emoji ? 'selected' : ''}"
        type="button"
        onclick={() => selectEmoji(emoji)}
        title={emoji}>{emoji}</button
      >
    {/each}
  {:else}
    <button
      onclick={() => {
        open = true;
      }}
      class={['-col-end-1', selected ? 'col-start-2' : 'col-start-1']}
    >
      Search
    </button>
  {/if}
</div>

<style>
  .emoji-selector {
    @apply bg-surface-backdrop-token;

    position: relative;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(50px, 1fr));
    gap: 0.5rem;
    border-radius: 0.5rem;
    padding: 1rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
    max-width: 320px;
  }

  .emoji {
    font-size: 2rem;
    cursor: pointer;
    border-radius: 0.25rem;
    transition: background 0.15s;
    padding: 0.25rem 0.5rem;
  }

  .emoji.selected,
  .emoji:hover {
    @apply bg-surface-hover-token;
  }

  .selected-emoji {
    margin-bottom: 0.75rem;
    font-size: 2.5rem;
    text-align: center;
  }
</style>
