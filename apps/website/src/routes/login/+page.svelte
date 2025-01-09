<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto, invalidateAll } from '$app/navigation';
  import { page } from '$app/state';
  import { getToastStore } from '@skeletonlabs/skeleton';

  const toastStore = getToastStore();

  let email = '';
  let password = '';
</script>

<svelte:head>
  <title>Login</title>
</svelte:head>

<div class="bg-zinc-800 h-screen flex items-center">
  <div
    class="container mx-auto bg-gradient-to-b from-slate-300 to-slate-100 gap-4 text-zinc-800 p-6 rounded-lg flex flex-col"
  >
    <h1 class="text-2xl font-semibold">Login</h1>
    <form method="post" action="?/login-with-google">
      <section>
        <button type="submit">Login with Google</button>
      </section>
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
            console.error(result);
            toastStore.trigger({
              message: 'Error occurred',
            });
          }
        };
      }}
    >
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
    </form>
  </div>
</div>
