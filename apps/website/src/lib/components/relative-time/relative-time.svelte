<script lang="ts">
  interface Props { to?: Date | number, from: Date | number }

  let { to = new Date(), from }: Props = $props();
</script>

{from}
{to}
