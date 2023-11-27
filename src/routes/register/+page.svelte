<script lang="ts">
    import { invalidateAll } from "$app/navigation";

  
  import { page } from "$app/stores";
  import client from "$lib/client/supabase";
  export let data;

  const searchParams = new URLSearchParams()
  console.info($page.url.hash.split('&'));
  
  const info = client.auth.setSession({
    access_token: searchParams.get('access_token') || '',
    refresh_token: searchParams.get('refresh_token') || '',

  }).then(r => {
    if(!r.error)
      invalidateAll();
    return r;
  });

   
</script>

{#await info}
Loading...
{:then dd}
  {dd.data.user?.id}
{/await}

I am the register route... i do not know what to do right now