<script lang="ts">
  import { goto } from '$app/navigation';
  export let data;
  let household = data.household;
  $: household = data.household;
  if(household === undefined) {
    goto('/dashboard/household')
  }
</script>

<div class="container mx-auto">

  <h1>{household.name}</h1>  
</div>