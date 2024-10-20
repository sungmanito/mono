<script lang="ts">
  import Drawer from '$lib/components/drawer/drawer.svelte';
  import type { Bill } from '$lib/server/actions/bills.actions';
  import Header from '$lib/components/header/header.svelte';
  import { enhance } from '$app/forms';
  import type { SubmitFunction } from '@sveltejs/kit';
  import FormLabel from '../formLabel/formLabel.svelte';
  import type { Household } from '$lib/server/actions/households.actions';
  import Button from '../button/button.svelte';
  import { invalidateAll } from '$app/navigation';

  interface Props {
    open?: boolean,
    bill: Bill | null,
    households?: Pick<Household, 'id' | 'name'>[],
    submit?: SubmitFunction
  }

  let {
    open = false,
    bill,
    households = [],
    submit = () => {
    return async ({ update, formElement }) => {
      formElement.reset();
      await update();
      await invalidateAll();
    };
  }
  }: Props = $props();
  let saving = false;
</script>

<Drawer {open} on:close let:close={closeDrawer}>
  <form
    action="/dashboard/bills?/updateBill"
    method="post"
    class="p-4"
    use:enhance={submit}
  >
    <input type="hidden" name="bill-id" value={bill?.id} />
    <Header color="secondary" tag="h2">
      Update {bill?.billName}
    </Header>
    <section class="grid grid-cols-3 gap-3">
      <div>
        <FormLabel label="Bill name">
          <input
            type="text"
            class="input"
            name="bill-name"
            value={bill?.billName}
          />
        </FormLabel>
      </div>
      <div>
        <FormLabel label="Household">
          <select
            class="select"
            name="household-id"
            required
            placeholder="Holding"
          >
            {#each households as household (household.id)}
              <option value={household.id}>{household.name}</option>
            {/each}
          </select>
        </FormLabel>
      </div>
      <div>
        <FormLabel label="Due Date">
          <input
            type="number"
            name="due-date"
            class="input"
            required
            min="1"
            max="28"
            value={bill?.dueDate}
          />
        </FormLabel>
      </div>
      <div class="col-span-3 flex justify-end gap-3">
        <Button
          type="button"
          variant="filled"
          disabled={saving}
          on:click={() => closeDrawer()}
        >
          Close
        </Button>
        <Button type="submit" disabled={saving}>Save</Button>
      </div>
    </section>
  </form>
</Drawer>
