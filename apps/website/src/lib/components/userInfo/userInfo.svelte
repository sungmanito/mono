<script lang="ts" module>
  import type { UserSqlType } from '@sungmanito/db/src/tables';
  export interface UserInfoProps {
    user: UserSqlType;
    preferName?: boolean;
  }
</script>

<script lang="ts">
  import Image from '$components/image/image.svelte';
  let { user, preferName = true, ...rest } = $props();
</script>

<div {...rest} class="user-info flex items-center gap-3">
  {#if user.userMetadata && user.userMetadata.picture}
    <Image src={user.userMetadata.picture} class="rounded-full h-8" />
  {/if}
  {#if preferName && user.userMetadata && user.userMetadata.name}
    {user.userMetadata.name}
  {:else}
    {user.email}
  {/if}
</div>
