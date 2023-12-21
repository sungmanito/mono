<script lang="ts">
  import Button from '$lib/components/button/button.svelte';
  import { PlusIcon } from 'lucide-svelte';
  import type { PageData } from '../$types';
  import HouseholdSideItem from './householdSideItem.svelte';
  import { page } from '$app/stores';
  import Create from '$lib/components/households/create.svelte';
  import { invalidateAll } from '$app/navigation';

  export let households: PageData['households'];
  export let userMap: PageData['streamable']['userHouseholds'];

  let showModal = false;
</script>

<Create
  open={showModal}
  on:close={() => (showModal = false)}
  submit={({ formData }) => {
    const members = formData.get('members') || '';
    console.info('WTF', members);
    if (typeof members === 'string') {
      console.info('Members', members);
      formData.delete('members');
      console.info('pre', formData.get('members'));
      for (const member of members.split(/\r?\n|,\s?|\s+/).filter((f) => f)) {
        console.info('hookers and blow');
        formData.append('members', member.trim());
      }
      console.info(formData.get('members'));
    }
    return async ({ formElement, update }) => {
      await update();
      formElement.reset();
      await invalidateAll();
    };
  }}
/>

<section class="bg-surface-50-900-token p-4 overflow-auto min-w-max">
  <div class="flex flex-col gap-2">
    <header class="flex justify-between gap-4 mb-4">
      <h3 class="h3">Households</h3>
      <section class="actions">
        <Button
          variant="primary"
          class="inline-flex gap-2 items-baseline"
          on:click={() => (showModal = true)}
        >
          <PlusIcon size="1em" />
          Add
        </Button>
      </section>
    </header>
    {#each households as household (household.id)}
      <HouseholdSideItem
        {household}
        {userMap}
        selected={$page.params.id === household.id}
      />
    {/each}
  </div>
</section>
