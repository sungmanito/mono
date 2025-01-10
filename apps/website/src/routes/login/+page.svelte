<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto, invalidateAll } from '$app/navigation';
  import { page } from '$app/state';
  import Button from '$components/button/button.svelte';
  import FormLabel from '$components/formLabel/formLabel.svelte';
  import Header from '$components/header/header.svelte';
  import { getToastStore } from '@skeletonlabs/skeleton';

  const toastStore = getToastStore();

  let email = $state('');
  let password = $state('');
</script>

<svelte:head>
  <title>Login</title>
</svelte:head>

<div class="flex flex-grow items-center">
  <div
    class="container mx-auto text-on-surface-token bg-surface-backdrop-token text-zinc-800 p-6 rounded-lg flex flex-col"
  >
    <Header tag="h1" class="mb-6" color="secondary">Login</Header>
    <form method="post" action="?/login-with-google" class="mb-6">
      <Button type="submit" variant="secondary">Login with Google</Button>
    </form>

    <form
      method="post"
      action="?/saveLogin"
      use:enhance={() => {
        return async ({ result }) => {
          if (result.type === 'success') {
            await invalidateAll();
            await goto(page.url.searchParams.get('url') || '/dashboard');
          } else if (result.type === 'error') {
            toastStore.trigger({
              message: 'Error occurred',
            });
          }
        };
      }}
    >
      <FormLabel label="Username" required>
        <input
          bind:value={email}
          name="username"
          type="text"
          class="input"
          placeholder="john@sungmanito.app"
        />
      </FormLabel>
      <FormLabel label="Password" required>
        <input
          bind:value={password}
          name="password"
          type="password"
          class="input"
          placeholder="Password"
        />
      </FormLabel>
      <Button class="mt-4" type="submit">Submit</Button>

      <footer class="mt-4 flex gap-4">
        <a href="/login/forgot" class="text-sky-500 hover:underline"
          >Forgot your password?</a
        >
        <a href="/signup" class="text-sky-500 hover:underline">Sign up</a>
      </footer>
    </form>
  </div>
</div>
