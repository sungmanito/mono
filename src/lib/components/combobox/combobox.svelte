<script lang="ts">
  import { ListBox, ListBoxItem } from '@skeletonlabs/skeleton';
  import { ChevronDownIcon } from 'lucide-svelte';
  import { computePosition, autoPlacement, offset, autoUpdate } from '@floating-ui/dom';
  import { onMount, createEventDispatcher } from 'svelte';

  export let value: string | number;
  export let options = [];

  const dispatcher = createEventDispatcher();

  let trigger: HTMLDivElement;
  let popup: HTMLDivElement;
  let open = false;

  onMount(() => {
    if(!trigger || !trigger.parentElement) return;

    const cleanup = autoUpdate(trigger.parentElement, popup, () => {
      if(!trigger.parentElement) return void 0;
      computePosition(trigger.parentElement, popup, {
        middleware: [offset(10), autoPlacement({
          allowedPlacements: ['top', 'bottom']
        })],
        placement: 'bottom'
      }).then(r => {
        Object.assign(popup.style, {
          left: `${r.x}px`,
          top: `${r.y}px`
        });
      });
    }, { 
      ancestorScroll: true,
    });

    return () => {
      cleanup();
    }

  });

  function bodyOnClick(e: MouseEvent) {
    const target = e.target as HTMLElement;
    if(open && (target.matches('.listbox-item') || popup.contains(target))) {
      console.info(open);
      open = false;
    }
  }

  $: dispatcher('change', value);

</script>

<svelte:body on:click={bodyOnClick} />

<div class="relative">

  <button
    class="btn btn-sm variant-filled justify-between items-center">
    <div>
      {value ?? 'Trigger'}
    </div>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
      class="border-l border-zinc-800 hover:bg-primary-hover-token"
      bind:this={trigger}
      on:focus={e => open = true}
      on:click={e => {
        e.stopPropagation();
        open = !open;
      }}
    >
      <ChevronDownIcon class="transition-all" size={16}/>
    </div>
  </button>
  
  <div class="card absolute" class:hidden={!open} bind:this={popup}>
    <ListBox>
      <ListBoxItem bind:group={value} name="medium" value="books">
        Books
      </ListBoxItem>
      <ListBoxItem bind:group={value} name="medium" value="movies">
        Movies
      </ListBoxItem>
      <ListBoxItem bind:group={value} name="medium" value="television">
        TV
      </ListBoxItem>
    </ListBox>
  </div>
</div>

