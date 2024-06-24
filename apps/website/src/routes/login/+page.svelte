<script lang="ts">
  import { enhance } from '$app/forms';
  import { getToastStore } from '@skeletonlabs/skeleton';
  import { page } from '$app/stores';
  import { goto, invalidateAll } from '$app/navigation';

  export let data;
  const toastStore = getToastStore();

  let email = '';
  let password = '';
  // $: if (!data.enabled) {
  //   goto('/');
  // }
</script>

<svelte:head>
  <title>Sungmanito &ndash; Login</title>
</svelte:head>

<form
  method="post"
  action="?/saveLogin"
  use:enhance={() => {
    return async ({ result }) => {
      if (result.type === 'success') {
        await invalidateAll();
        if (
          $page.url.searchParams.has('url') &&
          $page.url.searchParams.get('url')?.startsWith('/')
        ) {
          goto($page.url.searchParams.get('url'));
        } else {
          goto('/dashboard');
        }
      } else if (result.type === 'error' || result.type === 'failure') {
        toastStore.trigger({
          timeout: 7000,
          message: 'Login failed, please try again later',
        });
      } else if (result.type === 'redirect') {
        // Not sure I'll need this
        goto(result.location);
      }
      console.info(result, $page);
    };
  }}
>
  <div class="bg-zinc-800 h-screen flex items-center">
    <div
      class="container mx-auto bg-gradient-to-b from-slate-300 to-slate-100 gap-4 text-zinc-800 p-6 rounded-lg flex flex-col"
    >
      <h1 class="text-2xl font-semibold">Login</h1>
      <!-- TODO: Add Google login button -->
      <label class="flex gap-3 flex-col">
        <div class="font-bold">Username</div>
        <input
          bind:value={email}
          name="username"
          type="text"
          class="p-2 border rounded"
          placeholder="john@sungmanito.app"
        />
      </label>
      <label class="flex gap-3 flex-col">
        <div class="font-bold">Password</div>
        <input
          bind:value={password}
          name="password"
          type="password"
          class="p-2 border rounded"
          placeholder="Password"
        />
      </label>
      <button type="submit">Submit</button>

      <footer>
        <a href="/login/forgot">Forgot your password?</a>
        <a href="/signup">Sign up</a>
      </footer>
    </div>
  </div>
</form>
