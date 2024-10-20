<script lang="ts">
  import type { UserIdentity } from '@supabase/supabase-js';
  import Google from './google.svelte';
  import Email from './email.svelte';

  interface Props { identity: UserIdentity }

  let { identity }: Props = $props();
</script>

{#if identity.provider === 'google'}
  <Google {identity} />
{:else if identity.provider === 'email'}
  <Email {identity} />
{/if}
