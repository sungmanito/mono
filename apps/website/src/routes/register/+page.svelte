<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import Button from '$components/button/button.svelte';
  import FormLabel from '$components/formLabel/formLabel.svelte';
  import Header from '$components/header/header.svelte';

  import {
    Accordion,
    AccordionItem,
    getToastStore,
  } from '@skeletonlabs/skeleton';
  import type { SubmitFunction } from '@sveltejs/kit';

  const toastStore = getToastStore();

  let password = $state('');
  let passwordConfirm = $state('');
  let passwordsMatch = $derived(password === passwordConfirm);

  const validateForm: SubmitFunction = () => {
    return async ({ result }) => {
      if (result.type === 'success') {
        toastStore.trigger({
          message:
            'Please check your email and follow instructions there before logging in',
          timeout: 5000,
          autohide: false,
        });
        goto('/login');
      } else {
        toastStore.trigger({
          message: 'Registration failure. Please try again',
          autohide: false,
        });
      }
    };
  };
</script>

<svelte:head>
  <title>Sungmanito &ndash; Register</title>
</svelte:head>

<div class="flex-grow flex justify-center items-center">
  <div class="bg-surface-backdrop-token p-5 rounded-md max-w-full w-1/4">
    <Header>Register</Header>
    <form
      action="?/register"
      class="flex flex-col gap-4"
      use:enhance={validateForm}
      method="post"
    >
      <FormLabel label="E-Mail" required>
        <input placeholder="Email" type="email" class="input" name="email" />
      </FormLabel>
      <FormLabel label="Password" required>
        <input
          type="password"
          class="input"
          name="password"
          bind:value={password}
          required
          min="6"
        />
      </FormLabel>
      <FormLabel label="Password(confirm)" required>
        <input
          type="password"
          class="input"
          name="password-confirm"
          required
          min="6"
          bind:value={passwordConfirm}
        />
        {#snippet error()}
          {#if password.length > 0 && passwordConfirm.length > 0 && !passwordsMatch}
            I am the error
          {/if}
        {/snippet}
      </FormLabel>
      <Accordion>
        <AccordionItem padding="">
          <svelte:fragment slot="summary">
            <Header tag="h3" color="secondary">Optional</Header>
          </svelte:fragment>
          <svelte:fragment slot="content">
            <FormLabel label="Display name">
              <input
                type="text"
                class="input"
                placeholder="Given name"
                name="given"
              />
            </FormLabel>
          </svelte:fragment>
        </AccordionItem>
      </Accordion>
      <Button type="submit" size="lg" disabled={!passwordsMatch}>
        Register
      </Button>
    </form>
  </div>
</div>
