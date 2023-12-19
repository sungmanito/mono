<script lang="ts">
  import type { SubmitFunction } from '@sveltejs/kit';
  import Drawer from '$lib/components/drawer/drawer.svelte';
  import Header from '$lib/components/header/header.svelte';
  import { XIcon } from 'lucide-svelte';
  import Button from '../button/button.svelte';
  import { enhance } from '$app/forms';
  import FormLabel from '../formLabel/formLabel.svelte';
  import { invalidateAll } from '$app/navigation';

  export let open = false;
  export let submit: SubmitFunction = () => {
    return async ({ formElement, update }) => {
      await update();
      formElement.reset();
      invalidateAll();
    };
  };
</script>

<Drawer {open} on:close let:close={closeDrawer}>
  <form
    class="p-4"
    action="/dashboard/household/?/addHousehold"
    method="post"
    use:enhance={submit}
  >
    <Header color="secondary" tag="h2" class="mb-8">
      New household 
      <svelte:fragment slot="actions">
        <button
          type="button"
          on:click={() => closeDrawer()}
          class="btn-icon btn-icon-sm"
        >
          <XIcon size="1em" />
        </button>
      </svelte:fragment>
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
        <Button type="button" variant="filled" on:click={() => closeDrawer()}>
          Close
        </Button>
        <Button type="submit">Add</Button>
      </footer>
    </section>
  </form>
</Drawer>
