<script lang="ts">
  import Button from '$lib/components/button/button.svelte';
  import FormLabel from '$lib/components/formLabel/formLabel.svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { Loader2Icon } from 'lucide-svelte';
  import { getUserHouseholdsWithBillCount, updateHousehold } from '$lib/remotes/households.remote';

  let {
    component = false,
    onclose = () => void 0,
  }: { component?: boolean; onclose?: () => void } = $props();

  let saving = $state(false);
</script>

<svelte:boundary>
  {#snippet pending()}
    <div class="flex flex-col gap-4 p-4">
      <div class="h-8 w-64 rounded animate-pulse bg-surface-300 mb-2"></div>
      <div class="h-12 rounded animate-pulse bg-surface-300"></div>
    </div>
  {/snippet}

  {@const households = await getUserHouseholdsWithBillCount()}
  {@const household = households.find((h) => h.id === page.params.id)}

  {#if !household}
    <div class="p-4">Household not found.</div>
  {:else}
    <form
      class="flex flex-col gap-4 p-4"
      {...updateHousehold.enhance(async ({ submit }) => {
        saving = true;
        try {
          await submit();
          if (!component) {
            goto(`/dashboard/household/${household.id}`);
          } else {
            onclose();
          }
        } finally {
          saving = false;
        }
      })}
    >
      <input type="hidden" name="household-id" value={household.id} />

      <h2 class="h2 flex gap-2">
        {#if saving}
          <Loader2Icon size="1.5em" />
        {/if}
        Edit {household.name}
      </h2>
      <p class="text-surface-700-200-token">ID: {household.id}</p>

      <FormLabel label="Household Name">
        <input name="name" disabled={saving} type="text" class="input" value={household.name} />
      </FormLabel>

      <section class="flex gap-3">
        {#if component}
          <Button disabled={saving} variant="filled" onclick={() => onclose()}>Close</Button>
        {/if}
        <Button disabled={saving}>Save</Button>
      </section>
    </form>
  {/if}
</svelte:boundary>
