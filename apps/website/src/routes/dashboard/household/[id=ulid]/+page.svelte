<script lang="ts">
  import { pushState } from '$app/navigation';
  import { page } from '$app/state';
  import Alert from '$components/alert/alert.svelte';
  import Breadcrumb from '$lib/components/breadcrumb/breadcrumb.svelte';
  import { makeShowDrawerUtil } from '$lib/util/drawer.svelte';
  import {
    AlertTriangleIcon,
    CheckCircleIcon,
    CircleAlertIcon,
    UsersIcon,
  } from 'lucide-svelte';
  import { fade, slide } from 'svelte/transition';

  import Drawerify from '$components/drawerify/drawerify.svelte';
  import FormLabel from '$components/formLabel/formLabel.svelte';
  import Header from '$components/header/header.svelte';
  import Button from '$lib/components/button/button.svelte';
  import Drawer from '$lib/components/drawer/drawer.svelte';
  import Expandable from '$lib/components/expandable/expandable.svelte';
  import DeleteHousehold from '$lib/components/households/delete.svelte';
  import { formatNumber, ordinalSuffix } from '$lib/util/numbers';
  import BillDetails from '../../bills/[id=ulid]/+page.svelte';
  import CreateBillPage from '../../bills/create/+page.svelte';
  import EditBillPage from '../../bills/[id=ulid]/edit/+page.svelte';
  import EditHousehold from './edit/+page.svelte';
  import {
    getHouseholdDetail,
    claimHousehold,
  } from '$lib/remotes/households.remote';
  import { getPaymentsForIds, uploadImage } from '$lib/remotes/payments.remote';
  import { getUserBills } from '$lib/remotes/bills.remote';

  let editHousehold = makeShowDrawerUtil('');
  let editBill = makeShowDrawerUtil('');
  let showBillDetails = $state(false);
  let billDetailUrl = $state('');
  let showCreateBill = $state(false);
  let showCreateBillUrl = $state('');
  let showMembersDrawer = $state(false);
  let showDelete = $state(false);
  let showMultiPayments = $state(false);
  let selectedPayments: string[] = $state([]);
  let filter: 'all' | 'paid' | 'unpaid' = $state('all');

  function showEdit(householdId: string) {
    editHousehold.url = `/dashboard/household/${householdId}/edit`;
    editHousehold.show = true;
  }
</script>

<svelte:head>
  <title>Household</title>
</svelte:head>

<svelte:boundary>
  {#snippet pending()}
    <div class="flex-grow p-5 @container/main">
      <div class="@5xl/main:w-10/12 @5xl/main:mx-auto flex flex-col gap-4">
        <div
          class="h-8 w-64 rounded animate-pulse bg-surface-300 mt-4 mb-6"
        ></div>
        <div class="h-16 rounded animate-pulse bg-surface-300 mb-4"></div>
        {#each Array(4) as _}
          <div class="h-20 rounded animate-pulse bg-surface-300 mb-3"></div>
        {/each}
      </div>
    </div>
  {/snippet}

  {@const { household, bills } = await getHouseholdDetail(page.params.id)}

  {@const billsByStatus = bills.reduce(
    (all, cur) => {
      if (cur.isPaid) all.paid.push(cur);
      else all.unpaid.push(cur);
      all.all.push(cur);
      return all;
    },
    {
      paid: [] as typeof bills,
      all: [] as typeof bills,
      unpaid: [] as typeof bills,
    },
  )}
  {@const filteredBills = billsByStatus[filter]}
  {@const groupedByDate = filteredBills.reduce(
    (all, cur) => {
      if (all[cur.dueDate]) all[cur.dueDate].push(cur);
      else all[cur.dueDate] = [cur];
      return all;
    },
    {} as Record<number, typeof filteredBills>,
  )}

  <Drawerify
    bind:open={showBillDetails}
    onclose={() => {
      showBillDetails = false;
      billDetailUrl = '';
      history.back();
    }}
    component={BillDetails}
    url={billDetailUrl}
  />

  <Drawerify
    bind:open={editBill.show}
    url={editBill.url}
    onclose={() => {
      history.back();
    }}
    component={EditBillPage}
  />

  <Drawerify
    bind:open={showCreateBill}
    url={showCreateBillUrl}
    component={CreateBillPage}
  />

  <Drawerify
    url={editHousehold.url}
    bind:open={editHousehold.show}
    onclose={() => {
      editHousehold.url = '';
      history.back();
    }}
    component={EditHousehold}
  />

  <DeleteHousehold
    {household}
    open={showDelete}
    on:close={() => (showDelete = false)}
  />

  <Drawer
    bind:open={showMembersDrawer}
    onclose={() => (showMembersDrawer = false)}
  >
    <div class="p-4">
      <Header tag="h1">Members</Header>
    </div>
  </Drawer>

  <Drawer
    bind:open={showMultiPayments}
    onclose={() => (showMultiPayments = false)}
  >
    {#snippet children({ close })}
      <svelte:boundary>
        {#snippet pending()}
          <div class="p-4 flex flex-col gap-3">
            {#each Array(3) as _}
              <div class="h-32 rounded animate-pulse bg-surface-300"></div>
            {/each}
          </div>
        {/snippet}
        {@const multiPayments = await getPaymentsForIds(selectedPayments)}
        <div class="p-4 @container flex flex-col gap-4">
          <div class="flex justify-end">
            <Button type="button" variant="filled" onclick={close}>Close</Button
            >
          </div>
          {#each multiPayments as payment (payment.id)}
            <form
              enctype="multipart/form-data"
              {...uploadImage.enhance(async ({ submit }) => {
                await submit();
                getUserBills().refresh();
              })}
            >
              <fieldset class="border p-4 rounded">
                <legend class="px-3 text-lg font-semibold"
                  >{payment.billName}</legend
                >
                <input type="hidden" name="paymentId" value={payment.id} />
                <input
                  type="hidden"
                  name="householdId"
                  value={payment.householdId}
                />
                <div class="grid grid-cols-2 gap-4">
                  <FormLabel label="Amount (optional)">
                    <input
                      class="input"
                      name="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder={payment.billAmount?.toLocaleString(
                        undefined,
                        {
                          style: 'currency',
                          currency: payment.billCurrency ?? 'USD',
                        },
                      ) ?? '0.00'}
                    />
                  </FormLabel>
                  <FormLabel label="Notes (optional)">
                    <textarea
                      class="textarea"
                      name="proof"
                      placeholder="Notes about this payment"
                    ></textarea>
                  </FormLabel>
                </div>
                <div class="flex justify-end mt-2">
                  <Button
                    type="submit"
                    disabled={uploadImage.for(payment.id).pending > 0}
                    >Pay</Button
                  >
                </div>
              </fieldset>
            </form>
          {/each}
        </div>
      </svelte:boundary>
    {/snippet}
  </Drawer>

  <div class="flex-grow p-5 @container/main">
    <div class="@5xl/main:w-10/12 @5xl/main:mx-auto flex flex-col gap-4">
      <Breadcrumb
        class="mt-4"
        crumbs={[
          { href: '/dashboard', link: 'Dashboard' },
          { href: '/dashboard/household', link: 'Households' },
          {
            href: `/dashboard/household/${household.id}`,
            link: household.name,
          },
        ]}
      />

      {#if household.ownerId === null}
        <Alert type="warning:ghost">
          <div class="flex items-center gap-4">
            <AlertTriangleIcon size="2em" />
            <div class="flex flex-col">
              <Header tag="h3">Ownerless Household</Header>
              <p>
                This household has no owner and will be removed periodically.
                Claim ownership to keep it.
              </p>
            </div>
          </div>
          {#snippet actions()}
            <form
              {...claimHousehold.enhance(async ({ submit }) => {
                await submit();
                getHouseholdDetail(household.id).refresh();
              })}
            >
              <input type="hidden" name="household-id" value={household.id} />
              <Button type="submit" variant="filled">Claim household</Button>
            </form>
          {/snippet}
        </Alert>
      {/if}

      <Header tag="h1" color="secondary">
        {household.name}
        {#snippet actions()}
          <a
            href="#/"
            class="flex gap-2 items-center hover:underline"
            onclick={(e) => {
              e.preventDefault();
              showMembersDrawer = true;
            }}
          >
            <UsersIcon size="1em" />
            Members
          </a>
          <Button
            size="sm"
            variant="primary:ghost"
            type="button"
            onclick={() => showEdit(household.id)}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="destructive:ghost"
            type="button"
            onclick={() => (showDelete = true)}
          >
            Delete
          </Button>
        {/snippet}
      </Header>

      <main class="flex-grow flex flex-col gap-4">
        <Header tag="h3" tagClasses="sticky top-4 dark:bg-zinc-900/70">
          {#snippet actions()}
            <div class="btn-group variant-filled">
              {#each [['all', 'All'], ['unpaid', 'Unpaid'], ['paid', 'Paid']] as [action, text]}
                <Button
                  size="sm"
                  variant={filter === action ? 'primary' : 'custom'}
                  onclick={() => {
                    filter = action as typeof filter;
                  }}
                >
                  {text}
                </Button>
              {/each}
            </div>
            {#if selectedPayments.length > 0}
              <Button size="sm" onclick={() => (showMultiPayments = true)}>
                Mark {selectedPayments.length} as Paid
              </Button>
            {/if}
            <Button
              size="sm"
              variant="secondary"
              onclick={() => {
                showCreateBillUrl = `/dashboard/bills/create?household-id[]=${household.id}`;
                showCreateBill = true;
              }}
            >
              Add
            </Button>
          {/snippet}
          Bills
        </Header>

        <div role="list" data-testid="bill-list">
          {#each Object.entries(groupedByDate) as [date, dateBills]}
            {@const dateTotal = dateBills.reduce(
              (all, cur) => all + (cur.amount ? Number(cur.amount) : 0),
              0,
            )}
            <Expandable open>
              {#snippet header()}
                <Header
                  tag="h4"
                  color="secondary"
                  class="font-bold"
                  tagClasses="gap-4"
                >
                  Due on {date}{ordinalSuffix(Number(date))}
                  {#snippet actions()}
                    Total due: {formatNumber(dateTotal)}
                  {/snippet}
                </Header>
              {/snippet}
              <div class="ml-8 flex flex-col gap-4">
                {#each dateBills as bill (bill.id)}
                  <div
                    role="listitem"
                    class={[
                      'bill card mb-4',
                      bill.pastDue && 'variant-ghost-error',
                    ]}
                    in:fade
                    out:slide
                  >
                    <header
                      class="card-header pb-3 flex justify-between items-baseline"
                    >
                      <div class="inline-flex gap-2 items-center">
                        {#if !bill.isPaid}
                          <input
                            type="checkbox"
                            class="checkbox"
                            value={bill.paymentId}
                            onchange={(e) => {
                              const val = bill.paymentId;
                              if (!val) return;
                              if ((e.target as HTMLInputElement).checked) {
                                selectedPayments = [...selectedPayments, val];
                              } else {
                                selectedPayments = selectedPayments.filter(
                                  (id) => id !== val,
                                );
                              }
                            }}
                            checked={selectedPayments.includes(
                              bill.paymentId ?? '',
                            )}
                          />
                        {:else}
                          <CheckCircleIcon
                            size="1em"
                            class="text-success-400-500-token"
                          />
                        {/if}
                        <a
                          href={`/dashboard/bills/${bill.id}`}
                          class="text-xl font-semibold"
                          onclick={(e) => {
                            e.preventDefault();
                            billDetailUrl = `/dashboard/bills/${bill.id}`;
                            showBillDetails = true;
                            pushState(billDetailUrl, {});
                          }}
                        >
                          {bill.billName}
                          {#if bill.amount}
                            &ndash;
                            {formatNumber(bill.amount, bill.currency)}
                          {/if}
                        </a>
                      </div>
                      <section>
                        <Button
                          onclick={() => {
                            editBill.url = `/dashboard/bills/${bill.id}/edit`;
                            editBill.show = true;
                          }}
                        >
                          Edit
                        </Button>
                      </section>
                    </header>
                    <section class="p-4 pt-0 flex items-center gap-2">
                      Latest payment status:
                      {#if bill.paidAt !== null}
                        <CheckCircleIcon
                          class="text-success-400-500-token"
                          size="1.25em"
                        />
                        Paid ({bill.paidAt.toLocaleString(undefined)})
                      {:else}
                        <div class="contents">
                          <CircleAlertIcon
                            size="1em"
                            class="text-error-500-400-token"
                          />
                          Not Paid
                        </div>
                      {/if}
                    </section>
                  </div>
                {/each}
              </div>
            </Expandable>
          {:else}
            <div class="flex justify-center">
              <em>No bills match this filter</em>
            </div>
          {/each}
        </div>
      </main>
    </div>
  </div>
</svelte:boundary>
