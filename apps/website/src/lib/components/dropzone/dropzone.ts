import { isHtmlTarget } from '$lib/util/events';
export type MaybePromise<T> = T | Promise<T>;

export interface DropzoneOptions {
  dropEffect?: DataTransfer['dropEffect'];
  dragoverClass?: string;
  onDrop: (e: DragEvent, node: HTMLElement) => void;
  onDragEnter?: (e: DragEvent) => void;
  onDragLeave?: (e: DragEvent) => void;
}

/**
 * @type {import('svelte/action').Action}
 * @param node
 * @param options
 * @returns
 */
export function dropzone(node: HTMLElement, options: DropzoneOptions) {
  let state: Required<DropzoneOptions> = {
    dropEffect: 'move',
    dragoverClass: 'dropzone',
    onDragEnter: () => void 0,
    onDragLeave: () => void 0,
    ...options,
  };

  function handleDragEnter(e: DragEvent) {
    if (isHtmlTarget(e.target)) {
      e.target.classList.add(state.dragoverClass);
    }
    state?.onDragEnter(e);
  }

  function handleDragOver(e: DragEvent) {
    if (isHtmlTarget(e.target) && e.dataTransfer) {
      e.preventDefault();

      e.dataTransfer.dropEffect = state.dropEffect;
    }
  }

  function handleDragLeave(e: DragEvent) {
    if (isHtmlTarget(e.target)) {
      e.target.classList.remove(state.dragoverClass);
    }
    state?.onDragLeave(e);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    if (isHtmlTarget(e.target)) {
      e.target.classList.remove(state.dragoverClass);
    }
    state?.onDrop(e, node);
  }

  node.addEventListener('dragenter', handleDragEnter);
  node.addEventListener('dragover', handleDragOver);
  node.addEventListener('dragleave', handleDragLeave);
  node.addEventListener('drop', handleDrop);

  return {
    update(d: DropzoneOptions) {
      state = {
        ...state,
        ...d,
      };
    },
    destroy() {
      node.removeEventListener('dragenter', handleDragEnter);
      node.removeEventListener('dragover', handleDragOver);
      node.removeEventListener('dragleave', handleDragLeave);
      node.removeEventListener('drop', handleDrop);
    },
  };
}
