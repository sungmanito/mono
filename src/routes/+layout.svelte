<script lang="ts">
  import type { LayoutData } from './$types';
  import '../app.css';
  export let data: LayoutData;
</script>

{JSON.stringify(data)}

<slot />