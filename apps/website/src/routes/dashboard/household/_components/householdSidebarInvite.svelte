<script lang="ts" module>
  import type { PageData } from '../$types';
  export interface HouseholdSidebarInviteProps {
    invites: PageData['invites'];
  }
</script>

<script lang="ts">
  import HouseholdSidebarPlaceholder from './householdSidebarPlaceholder.svelte';
  import { UsersIcon, ReceiptIcon } from 'lucide-svelte';
  import Button from '$lib/components/button/button.svelte';
  import { enhance } from '$app/forms';
  let { invites }: HouseholdSidebarInviteProps = $props();
</script>

{#await invites}
  <HouseholdSidebarPlaceholder />
{:then invs}
  {#each invs as invite (invite.id)}
    <form action="/dashboard/household?/updateInvite" method="post" use:enhance>
      <input type="hidden" name="invite-id" value={invite.id} />
      <div class="flex flex-col gap-3 variant-ghost p-2 rounded">
        <div>{invite.household.name}</div>
        <div class="flex gap-2 items-center">
          <UsersIcon size="1em" />
          <div>
            {invite.household.members} Member(s)
          </div>
        </div>
        <div class="flex gap-2 items-center">
          <ReceiptIcon size="1em" />
          <div>
            {invite.household.bills} Bills
          </div>
        </div>
        <div class="flex gap-2 justify-center">
          <Button name="action" value="accept">Accept</Button>
          <Button variant="destructive:ghost" name="action" value="delete">
            Reject
          </Button>
        </div>
      </div>
    </form>
  {:else}
    No household invites
  {/each}
{:catch error}
  <div class="text-error-500">Failed to load invites: {error.message}</div>
{/await}
