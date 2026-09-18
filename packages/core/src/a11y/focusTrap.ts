import { getFocusableElements } from '../utils/dom';

export interface FocusTrapOptions {
    /**
     * Where focus goes on activation: an element, a selector inside the
     * container, `'first'` for the first tabbable element (the default),
     * `'container'` for the container itself, or `false` to leave it alone.
     */
    initialFocus?: HTMLElement | string | 'first' | 'container' | false;
    /** Put focus back where it was when the trap is released. Defaults to true. */
    returnFocus?: boolean;
}

export interface FocusTrap {
    activate(): void;
    deactivate(): void;
}

/**
 * Keeps Tab and Shift+Tab cycling inside `container`, as a modal dialog must.
 *
 * It deliberately does not pull focus back on `focusin`: a select or menu opened
 * inside the dialog is teleported to the body, and a trap that reclaimed focus
 * would fight the very popup the user just opened.
 */
export function createFocusTrap(container: HTMLElement, options: FocusTrapOptions = {}): FocusTrap {
    const { initialFocus = 'first', returnFocus = true } = options;
    let previous: HTMLElement | null = null;
    let active = false;

    const onKeydown = (event: KeyboardEvent) => {
        if (event.key !== 'Tab' || event.defaultPrevented) return;
        const items = getFocusableElements(container);
        const current = document.activeElement;
        if (items.length === 0) {
            event.preventDefault();
            container.focus();
            return;
        }
        const first = items[0]!;
        const last = items[items.length - 1]!;
        if (event.shiftKey && (current === first || current === container)) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && current === last) {
            event.preventDefault();
            first.focus();
        }
    };

    const focusInitial = () => {
        if (initialFocus === false) return;
        let target: HTMLElement | null = null;
        if (initialFocus instanceof HTMLElement) target = initialFocus;
        else if (initialFocus === 'container') target = container;
        else if (initialFocus === 'first') target = getFocusableElements(container)[0] ?? null;
        else target = container.querySelector<HTMLElement>(initialFocus);
        (target ?? container).focus({ preventScroll: true });
    };

    return {
        activate() {
            if (active) return;
            active = true;
            previous = document.activeElement as HTMLElement | null;
            if (!container.hasAttribute('tabindex')) container.setAttribute('tabindex', '-1');
            container.addEventListener('keydown', onKeydown);
            focusInitial();
        },
        deactivate() {
            if (!active) return;
            active = false;
            container.removeEventListener('keydown', onKeydown);
            if (returnFocus && previous && previous.isConnected) previous.focus({ preventScroll: true });
            previous = null;
        }
    };
}
