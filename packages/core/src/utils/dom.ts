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

/**
 * The direction an element is laid out in, which is what its keyboard has to
 * agree with: in right-to-left, Left is forward. It reads the computed
 * `direction`, so it sees a `dir` attribute anywhere above the element as well
 * as a direction set in CSS, and it answers `'ltr'` where there is nothing to
 * measure — off the document, or on the server.
 */
export function directionOf(el: Element | null | undefined): 'ltr' | 'rtl' {
    if (!isClient || !el) return 'ltr';
    return getComputedStyle(el).direction === 'rtl' ? 'rtl' : 'ltr';
}

/** Whether `el` is laid out right to left. The shorthand the keyboard helpers take. */
export function isRtl(el: Element | null | undefined): boolean {
    return directionOf(el) === 'rtl';
}
