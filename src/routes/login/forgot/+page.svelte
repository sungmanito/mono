<script>
  import { enhance } from "$app/forms";
  import Button from "$lib/components/button/button.svelte";
  import FormLabel from "$lib/components/formLabel/formLabel.svelte";

</script>

<svelte:head>
  <title>Forgot password</title>
</svelte:head>

<form action="?/forget" class="h-dvh" method="post" use:enhance>

  <section class="container mx-auto mt-8">

    <FormLabel label="Email">  
      <input type="email" class="input" name="email" placeholder="bob@email.com">
    </FormLabel>
    
    <Button class="mt-4">
      Submit
    </Button>
  </section>
</form>