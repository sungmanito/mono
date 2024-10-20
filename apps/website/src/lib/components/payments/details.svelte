<script lang="ts">
  import type { PageServerData } from '../../../routes/dashboard/payments/[id=ulid]/$types';
  interface Props { payment: PageServerData['payment'] }

  let { payment }: Props = $props();
</script>

... thinking...
