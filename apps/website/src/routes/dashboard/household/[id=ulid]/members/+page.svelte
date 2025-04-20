<script lang="ts">
  let { data } = $props();
  $inspect(data);
</script>

<div class="p-4 @container/name">
  <div class="">Placeholder</div>
  {#await data.user}
    Loading...
  {:then users}
    <pre>{JSON.stringify(users, null, 2)}</pre>
  {/await}
</div>
