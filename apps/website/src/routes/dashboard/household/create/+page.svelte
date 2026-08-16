<script lang="ts">
  import Button from '$lib/components/button/button.svelte';
  import FormLabel from '$lib/components/formLabel/formLabel.svelte';
  import Header from '$lib/components/header/header.svelte';
  import { XIcon } from 'lucide-svelte';
  import { addHousehold } from '$lib/remotes/households.remote';

  let {
    component = false,
    onclose = () => void 0,
    formKey,
  }: { component?: boolean; onclose?: () => void; formKey?: string } = $props();

  let membersRaw = $state('');
  let saving = $state(false);

  const members = $derived(
    membersRaw
      .split(/[\s,\n]+/)
      .map((m) => m.trim())
      .filter(Boolean),
  );

  // This component can be mounted more than once at a time (e.g. the
  // household list page and the sidebar both render it), so each mount
  // needs its own remote form instance.
  const householdForm = $derived(
    formKey ? addHousehold.for(formKey) : addHousehold,
  );
</script>

<form
  class="p-4"
  {...householdForm.enhance(async ({ submit }) => {
    saving = true;
    try {
      await submit();
      onclose();
    } finally {
      saving = false;
    }
  })}
>
  <Header color="secondary" tag="h2" class="mb-8">
    New household
    {#snippet actions()}
      {#if component}
        <button
          type="button"
          onclick={() => onclose()}
          class="btn-icon btn-icon-sm"
        >
          <XIcon size="1em" />
        </button>
      {/if}
    {/snippet}
  </Header>
  <section class="grid grid-cols-3 gap-3">
    <div>
      <FormLabel label="Household Name">
        <input
          class="input"
          name="householdName"
          placeholder="What's a good description for all the members?"
          disabled={saving}
          required
        />
      </FormLabel>
    </div>
    <div>
      <FormLabel label="Invite Members">
        <textarea
          bind:value={membersRaw}
          class="textarea"
          placeholder="Invite members to the household"
          disabled={saving}
        ></textarea>
      </FormLabel>
    </div>
    {#each members as email (email)}
      <input type="hidden" name="members[]" value={email} />
    {/each}
    <footer class="col-span-3 flex justify-end gap-3">
      {#if component}
        <Button type="button" variant="filled" onclick={() => onclose()}>
          Close
        </Button>
      {/if}
      <Button type="submit" disabled={saving}>Add</Button>
    </footer>
  </section>
</form>
