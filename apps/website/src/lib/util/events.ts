
export function isHtmlTarget(target: unknown): target is HTMLElement {
  return !!target && target instanceof HTMLElement;
}
