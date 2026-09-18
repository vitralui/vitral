export const isClient = typeof window !== 'undefined' && typeof document !== 'undefined';

const FOCUSABLE = [
    'a[href]',
    'area[href]',
    'button',
    'input:not([type="hidden"])',
    'select',
    'textarea',
    'iframe',
    'summary',
    '[contenteditable]:not([contenteditable="false"])',
    '[tabindex]'
].join(',');

/** Whether an element takes part in layout at all; jsdom has no boxes, so this reads styles rather than rects. */
export function isVisible(el: Element): boolean {
    if (el.closest('[hidden],[inert]')) return false;
    const style = getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden';
}

/** Everything under `root` a Tab press can land on, in document order. */
export function getFocusableElements(root: Element): HTMLElement[] {
    return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.tabIndex >= 0 && !(el as HTMLButtonElement).disabled && !el.closest('fieldset[disabled]') && isVisible(el)
    );
}

export function focus(el: HTMLElement | null | undefined, options: FocusOptions = { preventScroll: true }): void {
    el?.focus(options);
}

export function getActiveElement(): HTMLElement | null {
    return isClient ? (document.activeElement as HTMLElement | null) : null;
}
