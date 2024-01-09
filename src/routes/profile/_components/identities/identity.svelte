<script lang="ts">
  import type { UserIdentity } from '@supabase/supabase-js';
  import Google from './google.svelte';
  import Email from './email.svelte';

  export let identity: UserIdentity;
</script>

{#if identity.provider === 'google'}
  <Google {identity} />
{:else if identity.provider === 'email'}
  <Email {identity} />
{/if}
