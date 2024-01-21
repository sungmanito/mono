<script lang="ts">
  import Drawer from '$lib/components/drawer/drawer.svelte';
  import { XIcon } from 'lucide-svelte';
  import Header from '../header/header.svelte';
  import FormLabel from '../formLabel/formLabel.svelte';
  import type { Household } from '$lib/server/actions/households.actions';
  import Button from '../button/button.svelte';
  import { enhance } from '$app/forms';
  import type { SubmitFunction } from '@sveltejs/kit';
  export let open = false;
  export let households: Pick<Household, 'id' | 'name'>[] = [];
  export let submit: SubmitFunction = () => {
    return async ({ update, formElement }) => {
      formElement.reset();
      await update();
    };
  };
</script>

<Drawer {open} on:close let:close={closeMe}>
  <form
    action="/dashboard/bills?/addBill"
    method="post"
    class="p-4"
    use:enhance={submit}
  >
    <Header color="secondary" tag="h2">
      Create new bill
      <svelte:fragment slot="actions">
        <button on:click={() => closeMe()}>
          <XIcon size="1em" />
        </button>
      </svelte:fragment>
    </Header>
    <section class="grid grid-cols-3 gap-3">
      <div>
        <FormLabel label="Name">
          <input
            class="input"
            name="name"
            placeholder="Name of the bill"
            required
          />
        </FormLabel>
      </div>
      <div>
        <FormLabel label="Household">
          <select
            class="select"
            name="household-id"
            required
            placeholder="Please select a household"
          >
            <option value="-1" disabled>Please select a household</option>
            {#each households as household (household.id)}
              <option value={household.id}>{household.name}</option>
            {/each}
          </select>
        </FormLabel>
      </div>
      <div>
        <FormLabel label="Due date">
          <input
            class="input"
            name="due-date"
            type="number"
            min="1"
            max="28"
            required
            placeholder="Due date between 1 and 28"
          />
        </FormLabel>
      </div>
      <div class="col-span-3 flex justify-end gap-3">
        <Button variant="filled" on:click={() => closeMe()}>Close</Button>
        <Button type="submit">Add</Button>
      </div>
    </section>
  </form>
</Drawer>
