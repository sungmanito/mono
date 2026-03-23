<script lang="ts" module>
  import type { getPendingInvites } from '$lib/remotes/households.remote';
  export interface HouseholdSidebarInviteProps {
    invites: ReturnType<typeof getPendingInvites>;
  }
</script>

<script lang="ts">
  import HouseholdSidebarPlaceholder from './householdSidebarPlaceholder.svelte';
  import { UsersIcon, ReceiptIcon } from 'lucide-svelte';
  import Button from '$lib/components/button/button.svelte';
  import { respondToInvite } from '$lib/remotes/households.remote';
  let { invites }: HouseholdSidebarInviteProps = $props();
</script>

{#await invites}
  <HouseholdSidebarPlaceholder />
{:then invs}
  {#each invs as invite (invite.id)}
    {@const acceptForm = respondToInvite.for(invite.id)}
    {@const rejectForm = respondToInvite.for(invite.id)}
    <div class="flex flex-col gap-3 variant-ghost p-2 rounded">
      <div>{invite.household.name}</div>
      <div class="flex gap-2 items-center">
        <UsersIcon size="1em" />
        <div>{invite.household.members} Member(s)</div>
      </div>
      <div class="flex gap-2 items-center">
        <ReceiptIcon size="1em" />
        <div>{invite.household.bills} Bills</div>
      </div>
      <div class="flex gap-2 justify-center">
        <form {...acceptForm}>
          <input type="hidden" name="invite-id" value={invite.id} />
          <Button
            name="action"
            value="accept"
            type="submit"
            disabled={acceptForm.pending > 0}>Accept</Button
          >
        </form>
        <form {...rejectForm}>
          <input type="hidden" name="invite-id" value={invite.id} />
          <Button
            variant="destructive:ghost"
            name="action"
            value="delete"
            type="submit"
            disabled={rejectForm.pending > 0}>Reject</Button
          >
        </form>
      </div>
    </div>
  {:else}
    No household invites
  {/each}
{:catch err}
  <div class="text-error-500">Failed to load invites: {err.message}</div>
{/await}
