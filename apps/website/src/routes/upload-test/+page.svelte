<script>
  import { enhance } from '$app/forms';
  export let data;
</script>

<ol>
  {#each data.files as file}
    <li>{file.name}</li>
  {/each}
</ol>
<form action="?/upload" method="post" enctype="multipart/form-data" use:enhance>
  <input
    type="file"
    name="testing"
    accept="image/png, image/jpeg, image/webp"
  />
  <button> Submit </button>
</form>
