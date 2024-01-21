<script lang="ts">
  import type { UserIdentity } from '@supabase/supabase-js';
  import { MailIcon } from 'lucide-svelte';
  import { formatDate } from './util';

  export let identity: UserIdentity;
</script>

{#if identity.provider !== 'email'}
  Error
{:else}
  <div class="flex gap-3 rounded p-4 variant-filled-surface">
    <MailIcon class="w-8 h-8" />
    <div class="flex flex-col gap-3">
      <div>
        Identity ID: {identity.id}
      </div>
      <div>
        Email: {identity.identity_data?.email}
      </div>
      <div>
        Last sign in: {formatDate(identity.last_sign_in_at)}
      </div>
      <div>
        Created at {formatDate(identity.created_at)}
      </div>
      <div>
        Last updated at {formatDate(identity.updated_at)}
      </div>
    </div>
  </div>
{/if}
