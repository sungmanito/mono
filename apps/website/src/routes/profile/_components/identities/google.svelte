<script lang="ts">
  import type { UserIdentity } from '@supabase/supabase-js';
  import GoogleIcon from '$lib/components/googleIcon.svelte';
  import { formatDate } from './util';

  interface Props { identity: UserIdentity }

  let { identity }: Props = $props();
</script>

{#if identity.provider !== 'google'}
  Error
{:else}
  <div class="flex gap-3 rounded p-4 variant-filled-surface">
    <GoogleIcon class="w-8 h-8" />
    <div class="flex flex-col gap-3">
      <div>
        Identity ID: {identity.id}
      </div>
      <div>
        Full Name: {identity.identity_data?.full_name || 'None given'}
      </div>
      <div>
        Email: {identity.identity_data?.email}
      </div>
      <div>
        Last sign in: {formatDate(identity.last_sign_in_at)}
      </div>
      <div>
        Created at: {formatDate(identity.created_at)}
      </div>
      <div>
        Last updated: {formatDate(identity.updated_at)}
      </div>
    </div>
    {#if identity.identity_data?.avatar_url}
      <div class="ml-auto">
        <img
          class="rounded"
          src={identity.identity_data?.avatar_url}
          alt={`${identity.provider} avatar`}
        />
        <button disabled class="btn mx-auto mt-3 btn-sm variant-filled"
          >Use image</button
        >
      </div>
    {/if}
  </div>
{/if}
