<script lang="ts">
  import client from '$lib/client/supabase';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

  let email = '';
  let password = '';

  async function handleLoginWithPassword(e: SubmitEvent & { currentTarget: HTMLFormElement }) {
    e.preventDefault();

    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    console.info(data, error);

    fetch('?/saveLogin', {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  
  onMount(() => {
    if($page.data.user.id !== '') {
      goto('/');
    }
  })

</script>

<form on:submit={handleLoginWithPassword}>
  <div class="bg-zinc-800 h-screen flex items-center">
    <div class="container mx-auto bg-gradient-to-b from-slate-300 to-slate-100 gap-4 text-zinc-800 p-6 rounded-lg flex flex-col">
      <h1 class="text-2xl font-semibold">
        Login
      </h1>
      <section>
        <button type="button" on:click={() => client.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: 'http://localhost:5173/login?/update',
          }
        }).then(console.info).catch(console.error) }>
          Google
        </button>
      </section>
      <label class="flex gap-3 flex-col">
        <div class="font-bold">
          Username
        </div>
        <input bind:value={email} name="username" type="text" class="p-2 border rounded" placeholder="john@sungmanito.app">
      </label>
      <label for="" class="flex gap-3 flex-col">
        <div class="font-bold">Password</div>
        <input bind:value={password} name="password" type="password" class="p-2 border rounded" placeholder="Password">
      </label>
      <button type="submit">Submit</button>
    </div>
  </div>
</form>