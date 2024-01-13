<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import client from '$lib/client/supabase';
  import { getToastStore } from '@skeletonlabs/skeleton';
  import type { EventHandler } from 'svelte/elements';

  const toastStore = getToastStore();

  let email = '';
  let password = '';

  async function handleLoginWithPassword(
    e: Parameters<EventHandler<Event, HTMLFormElement>>[0],
  ) {
    e.preventDefault();

    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (data.user) {
      const f = await fetch('?/saveLogin', {
        method: 'POST',
        body: JSON.stringify(data || {}),
      }).then((r) => r.json());

      if (f.type === 'success') {
        await invalidateAll();
        goto('/dashboard');
      }
    } else if (error) {
      toastStore.trigger({
        message: `Error occurred${
          error.message ? ': ' + error.message : null
        } `,
      });
    }
  }
</script>

<form on:submit={handleLoginWithPassword}>
  <div class="bg-zinc-800 h-screen flex items-center">
    <div
      class="container mx-auto bg-gradient-to-b from-slate-300 to-slate-100 gap-4 text-zinc-800 p-6 rounded-lg flex flex-col"
    >
      <h1 class="text-2xl font-semibold">Login</h1>
      <section>
        <form action="?/login-with-google" method="post">
          <button class="btn btn-sm variant-outline-surface" type="submit">
            Login with Google
          </button>
        </form>
      </section>
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
      <label for="" class="flex gap-3 flex-col">
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
      </footer>
    </div>
  </div>
</form>
