<script lang="ts">
  import Header from '$lib/components/header/header.svelte';
  import FormLabel from '$lib/components/formLabel/formLabel.svelte';
  import Button from '$lib/components/button/button.svelte';
</script>

<svelte:head>
  <title>
    Sungmanito &ndash; Sign up
  </title>
</svelte:head>

<div class="container mx-auto bg-surface-active-token rounded-lg my-8 p-6">
  <Header class="mb-4">
    Signup
  </Header>

  <form action="?/signup" method="post">
    <FormLabel label="Email" required>
      <input type="email" class="input" name="email" placeholder="bob@email.com">
    </FormLabel>
    <FormLabel label="Password" required>
      <input type="password" name="password" class="input" placeholder="Please use a secure password">
    </FormLabel>
    <FormLabel label="Confirm Password" required>
      <input type="password" name="password_confirm" class="input">
    </FormLabel>

    <Header tag="h3" color="secondary" class="mt-4">
      Optional
    </Header>

    <FormLabel label="Avatar URL">
      <input type="url" name="avatar_url" class="input" placeholder="https://images.something.com/my-cool-profile.png">
    </FormLabel>

    <FormLabel label="Displayed Name">
      <input type="text" class="input" name="name" placeholder="e.g. 'John'">

    </FormLabel>

    <Button class="mt-4">
      Submit
    </Button>
    
  </form>

</div>