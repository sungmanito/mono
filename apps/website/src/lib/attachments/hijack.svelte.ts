import { browser } from '$app/environment';
import type { makeShowDrawerUtil } from '$utils/drawer.svelte';
import type { Attachment } from 'svelte/attachments';
export type HijackProps = {
  onclick?: (event: MouseEvent) => void;
  preventDefault?: boolean;
};

export const hijack: (opts: HijackProps) => Attachment<HTMLAnchorElement> =
  ({ onclick = () => void 0, preventDefault = true }) =>
  (el) => {
    function handleClick(evt: MouseEvent) {
      if (evt.defaultPrevented) return;
      if (preventDefault) evt.preventDefault();
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

export type OS = 'windows' | 'macos' | 'linux' | 'unknown';

export function getOs(): OS {
  if (browser) {
    const ua = navigator.userAgent;
    if (/Win/i.test(ua)) return 'windows';
    // Avoid classifying iOS (iPhone/iPad/iPod) as macOS
    if (/Mac/i.test(ua) && !/iPhone|iPad|iPod/i.test(ua)) return 'macos';
    if (/Linux/i.test(ua)) return 'linux';
    return 'unknown';
  }
  return 'unknown';
}

export const hijackNav = ({ store, onclick }: HijackNavProps) =>
  hijack({
    onclick: (evt) => {
      const os = getOs();
      if (os === 'macos' && evt.metaKey) return;
      if (os !== 'macos' && evt.ctrlKey) return;
      evt.preventDefault();

      const href = (evt.currentTarget as HTMLAnchorElement).href;

      if (href) {
        store.url = href;
        store.show = true;
      }

      onclick?.(evt);
    },
    preventDefault: false,
  });
