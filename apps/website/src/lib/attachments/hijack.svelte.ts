import type { makeShowDrawerUtil } from '$utils/drawer.svelte';
import type { Attachment } from 'svelte/attachments';
export type HijackProps = {
  onclick?: (event: MouseEvent) => void;
};
export const hijack: (opts: HijackProps) => Attachment<HTMLAnchorElement> =
  ({ onclick = () => void 0 }) =>
  (el) => {
    function handleClick(evt: MouseEvent) {
      if (evt.defaultPrevented) return;
      evt.preventDefault();
      onclick(evt);
    }

    el.addEventListener('click', handleClick);

    return () => {
      el.removeEventListener('click', handleClick);
    };
  };

export type HijackNavProps = HijackProps & {
  store: ReturnType<typeof makeShowDrawerUtil>;
};

export const hijackNav = ({ store, onclick }: HijackNavProps) =>
  hijack({
    onclick: (evt) => {
      const href = (evt.currentTarget as HTMLAnchorElement).href;

      if (href) {
        store.url = href;
        store.show = true;
      }

      onclick?.(evt);
    },
  });
