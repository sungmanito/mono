<script lang="ts">
  import Image from '$components/image/image.svelte';
  import type { UserSqlType } from '@sungmanito/db/src/tables';
  export let user: UserSqlType;
  export let preferName = true;
</script>

<div {...$$restProps} class="user-info flex items-center gap-3">
  {#if user.userMetadata && user.userMetadata.picture}
    <Image src={user.userMetadata.picture} class="rounded-full h-8" />
  {/if}
  {#if preferName && user.userMetadata && user.userMetadata.name}
    {user.userMetadata.name}
  {:else}
    {user.email}
  {/if}
</div>
