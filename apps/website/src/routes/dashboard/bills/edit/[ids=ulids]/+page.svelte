<script lang="ts" module>
  import Header from '$components/header/header.svelte';
  import type { PageProps } from './$types';
  type Props = PageProps & { component?: boolean; onclose: () => void };
</script>

<script lang="ts">
  import Button from '$components/button/button.svelte';
  import { XIcon } from 'lucide-svelte';
  import { enhance } from '$app/forms';
  import FormLabel from '$components/formLabel/formLabel.svelte';

  let { data, component = false, onclose = () => void 0 }: Props = $props();
</script>

{#snippet selectOptions({
  name,
  selected = null,
}: {
  name: string;
  selected: { value: string; label: string } | undefined;
})}
  <select {name} class="select">
    {#each data.households as option (option.value)}
      <option value={option.value} selected={selected === option}
        >{option.label}</option
      >
    {/each}
  </select>
{/snippet}

<div class="@container/main p-6 flex-grow">
  <form
    action="?/save"
    method="POST"
    use:enhance={() => {
      return async () => {
        onclose();
      };
    }}
  >
    <Header tag="h2">
      Edit Bills
      {#snippet actions()}
        {#if component}
          <Button onclick={onclose} variant="custom" class="btn-icon">
            <XIcon size="1.25em" />
          </Button>
        {/if}
      {/snippet}
    </Header>

    {#each data.bills as bill (bill.id)}
      <div class="p-4 my-2 rounded variant-ghost-surface">
        <Header color="custom" tag="h4" class="mb-2">
          {bill.billName}
        </Header>
        <input type="hidden" name="bills[].id" value={bill.id} />
        <FormLabel label="Bill name">
          <input
            class="input"
            type="text"
            name="bills[].name"
            value={bill.billName}
          />
        </FormLabel>

        <FormLabel label="Household">
          {@render selectOptions({
            name: 'bills[].householdId',
            selected: data.households.find((h) => h.value === bill.householdId),
          })}
        </FormLabel>

        <FormLabel label="Due date">
          <input
            class="input"
            type="number"
            name="bills[].dueDate"
            value={bill.dueDate}
            min="1"
            max="28"
            step="1"
            inputmode="numeric"
            required
          />
        </FormLabel>
      </div>
    {/each}
    <footer>
      <Button type="submit" class="mt-4">Save</Button>
    </footer>
  </form>
</div>
