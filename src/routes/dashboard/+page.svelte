<script lang="ts">
  import Header from "$lib/components/header/header.svelte";
  import { Accordion, AccordionItem, Step, Stepper } from "@skeletonlabs/skeleton";
  import { PlusIcon, HomeIcon, XIcon } from "lucide-svelte";
  export let data;

  let billName = '';
  let dueDate = 1;
  let householdId = '';  

  let modalEl: HTMLDialogElement;

</script>

<svelte:head>
  <title>Dashboard</title>
</svelte:head>

<Header class="mt-4 mb-4">
  Dashboard
  <svelte:fragment slot="actions">
    <button
      class="btn variant-ghost-primary btn-sm flex gap-1"
      on:click={() => {
        modalEl.showModal();
      }}><PlusIcon size="1.1em" />New Bill</button>
    <button class='btn variant-ghost-primary btn-sm flex gap-2'>
      <HomeIcon size='1.1em' />
      New Household
    </button>
  </svelte:fragment>
</Header>

<dialog bind:this={modalEl} class="bg-surface-800 w-10/12 text-white p-4 rounded backdrop:bg-zinc-900/40" id="add-bill-ui">
  <header class="flex justify-end">
    <button class="btn btn-icon" on:click={() => {
      modalEl.close();
    }}>
      <XIcon size="1.1em" />
    </button>
  </header>
  <form action="?/addBill" method="post" >
    <Stepper on:complete={e => {

      const fd = new FormData();
      fd.append('household-id', householdId);
      fd.append('bill-name', billName);
      fd.append('due-date', dueDate.toString());
      fetch('?/addBill', {
        method: 'post',
        body: fd
      }).then(console.info).catch(console.error);
      // Reset
      [householdId, billName, dueDate] = ['','', 1];

      modalEl.close();
    }}>
      <Step>
        <svelte:fragment slot="header">Bill Information</svelte:fragment>
        <input
          class="px-2 input"
          type="text"
          name="bill-name"
          placeholder="Name of the bill"
          required
          bind:value={billName}
        />
        <input bind:value={dueDate} name="dueDate" class="px-2 input" placeholder="1" type="number" min="1" max="31" required />
      </Step>
      <Step>
        <svelte:fragment slot="header">Household</svelte:fragment>
        <select bind:value={householdId} name="household-id" class="input p-3">
          {#each data.households as household}
            <option value={household.id}>
              {household.name} &ndash; {household.householdCount} member(s)
            </option>
          {:else}
            <option disabled>
              No households
            </option>
          {/each}
        </select>
      </Step>
    </Stepper>
  </form>
</dialog>


<div class="">
  <Accordion class="flex flex-col gap-2">
    <AccordionItem open class="card variant-soft-surface">
      <svelte:fragment slot="summary">
        <Header tag="h3" color="secondary">
          Past Due
        </Header>
      </svelte:fragment>
      <svelte:fragment slot="content">
        <section class="p-4">
          {#each data.groupings.past as { bills, household}}
            <div>
              {bills.billName}
            </div>
          {/each}
        </section>
      </svelte:fragment>
    </AccordionItem>
    <AccordionItem open class="card variant-soft-surface">
      <svelte:fragment slot="summary">
        <Header tag="h3" color="secondary">
          Upcoming
        </Header>
      </svelte:fragment>
      <svelte:fragment slot="content">
        <div class="flex flex-col gap-4">
          {#each data.groupings.upcoming as { bills, household }}
            <div class="card variant-ghost-primary">
              <Header tag="h4" class="card-header">
                {bills.billName} due on {bills.dueDate}
              </Header>
              <section class="p-4">
                Other relevant information
              </section>
  
            </div>
            {:else}
            No Upcoming bills
          {/each}
        </div>
      </svelte:fragment>
    </AccordionItem>
    <AccordionItem open={data.groupings.comingSoon.length > 0} class="card variant-soft-surface">
      <svelte:fragment slot="summary">
        <Header tag="h3" color="secondary">
          Coming Soon
        </Header>
      </svelte:fragment>
      <svelte:fragment slot="content">
        <div class="flex flex-col gap-2">
          {#each data.groupings.comingSoon as { bills }}
            {bills.billName}
          {:else}
            <p>No bills coming soon</p>
          {/each}
        </div>
      </svelte:fragment>
    </AccordionItem>
    <AccordionItem open={data.groupings.paid.length > 0} class="card variant-soft-surface">
      <svelte:fragment slot="summary">
        <Header tag="h3" color="secondary">
          Paid
        </Header>
      </svelte:fragment>
      <svelte:fragment slot="content">
        <div class="grid grid-cols-3 gap-32">
          {#each data.groupings.paid as {bills, household}}
            <div class="card variant-filled-primary">
              <header class="card-header p-4">
                {bills.billName} - due on {bills.dueDate}
              </header>
            </div>
          {:else}
            <div class="">
              No paid bills
            </div>
          {/each}
        </div>
      </svelte:fragment>
    </AccordionItem>
    <AccordionItem open={data.groupings.rest.length > 0}>
      <svelte:fragment slot="summary">
        <Header tag="h3" color="secondary">
          Other bills
        </Header>
      </svelte:fragment>
      <svelte:fragment slot="content">
        <table class="table table-interactive">
          <thead>
            <th>Bill Name</th>
            <th>Due Date</th>
            <th>Household</th>
          </thead>
          <tbody>
            {#each data.groupings.rest as { bills, household }}
              <tr>
                <td>
                  {bills.billName}
                </td>
                <td>
                  {bills.dueDate}
                </td>
                <td>
                  {household.name}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </svelte:fragment>
    </AccordionItem>
  </Accordion>

</div>