<script lang="ts">
    import Button from "$lib/components/button/button.svelte";
import { CrownIcon, Trash2Icon } from "lucide-svelte";


</script>

<div class="flex gap-2">
  <CrownIcon size="0.9em" />
  <span>
    Jim Burbridge
  </span>
  <button class="btn-icon btn-icon-sm">
    <Trash2Icon />
  </button>
</div>