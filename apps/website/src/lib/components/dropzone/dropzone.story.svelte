<script lang="ts">
  import type { Hst } from '@histoire/plugin-svelte';
  import Dropzone from './dropzone.svelte';
  // eslint-disable-next-line
  export let Hst: Hst;
</script>

<Hst.Story>
  <div id="drag-me" draggable="true">Drag me</div>
  <Dropzone />
</Hst.Story>
