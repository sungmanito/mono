<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidate } from '$app/navigation';
  import Button from '$lib/components/button/button.svelte';
  import FormLabel from '$lib/components/formLabel/formLabel.svelte';
  import Header from '$lib/components/header/header.svelte';
  import type { SubmitFunction } from '@sveltejs/kit';
  import { XIcon } from 'lucide-svelte';

  export let component = false;
  export let onclose: () => void = () => void 0;

  export let submit: SubmitFunction = ({ formData }) => {
    const rawMembers = formData.get('members') || '';
    if (typeof rawMembers !== 'string' || rawMembers === '')
      formData.delete('members');
    else if (typeof rawMembers === 'string') {
      const members = rawMembers.split(/[\s,\n]+/);
      formData.delete('members');
      for (const member of members) {
        formData.append('members', member);
      }
    }

    console.info(formData);

    return async ({ update }) => {
      await update();
      onclose();
      invalidate('user:households');
    };
  };
</script>

<form
  class="p-4"
  action="/dashboard/household/?/addHousehold"
  method="post"
  use:enhance={submit}
>
  <Header color="secondary" tag="h2" class="mb-8">
    New household
    {#snippet actions()}
      {#if component}
        <button
          type="button"
          on:click={() => onclose()}
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
          name="household-name"
          placeholder="What's a good description for all the members?"
          required
        />
      </FormLabel>
    </div>
    <div>
      <FormLabel label="Invite Members">
        <textarea
          name="members"
          class="textarea"
          placeholder="Invite members to the household"
        ></textarea>
      </FormLabel>
    </div>
    <footer class="col-span-3 flex justify-end gap-3">
      {#if component}
        <Button type="button" variant="filled" onclick={() => onclose()}>
          Close
        </Button>
      {/if}
      <Button type="submit">Add</Button>
    </footer>
  </section>
</form>
