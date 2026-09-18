import { getFocusableElements, lockScroll } from '@vitral/core';
import { toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue';
import { useFocusTrap } from './useFocusTrap';
import { useOverlay } from './useOverlay';

export interface UseModalOptions {
    /** The `role="dialog"` element: focus moves into it and, when modal, is kept there. */
    panel: Ref<HTMLElement | null | undefined>;
    /** The element that stacks — the mask the panel sits on. Defaults to the panel. */
    mask?: Ref<HTMLElement | null | undefined>;
    /** Trap focus and lock the page's scroll. Defaults to true. */
    modal?: MaybeRefOrGetter<boolean>;
    /** Defaults to true. */
    closeOnEscape?: MaybeRefOrGetter<boolean>;
    /** Close on a press on the mask itself (not on the panel). */
    dismissableMask?: MaybeRefOrGetter<boolean>;
    /** Lock the page's scroll even when the dialog is not modal. */
    blockScroll?: MaybeRefOrGetter<boolean>;
    /**
     * Where to look for the first focusable element, in order, before falling
     * back to the whole panel — the content before the footer, the footer before
     * the header's close button. An `[autofocus]` element anywhere wins.
     */
    focusScopes?: () => (HTMLElement | null | undefined)[];
    onClose: (reason: 'escape' | 'mask') => void;
}

function initialFocusTarget(panel: HTMLElement, scopes: (HTMLElement | null | undefined)[]): HTMLElement {
    const focusable = getFocusableElements(panel);
    const marked = panel.querySelector<HTMLElement>('[autofocus]');
    if (marked && focusable.includes(marked)) return marked;
    for (const scope of scopes) {
        const first = scope && focusable.find((el) => scope.contains(el));
        if (first) return first;
    }
    if (focusable[0]) return focusable[0];
    if (!panel.hasAttribute('tabindex')) panel.setAttribute('tabindex', '-1');
    return panel;
}

/**
 * What a dialog and a drawer share, as the WAI-ARIA modal dialog pattern asks:
 * stacked on the `modal` z-index, closed by Escape while topmost, focus moved in
 * on opening and back to where it was on closing, Tab kept inside and the page
 * behind held still while modal. It all follows the panel element: it starts
 * when the element appears and is undone when it goes.
 *
 * Returns the listeners for the mask, which close on a press that starts and
 * ends on the mask itself — a drag that began inside the panel does not count.
 */
export function useModal(options: UseModalOptions) {
    const modal = () => toValue(options.modal) ?? true;

    useOverlay({
        overlay: options.mask ?? options.panel,
        position: false,
        zIndexKey: 'modal',
        onEscape: () => {
            if (toValue(options.closeOnEscape) ?? true) options.onClose('escape');
        }
    });

    useFocusTrap(options.panel, modal, { initialFocus: false, returnFocus: false });

    watch(
        () => options.panel.value,
        (panel, _previous, onCleanup) => {
            if (!panel) return;
            const returnTo = document.activeElement as HTMLElement | null;
            initialFocusTarget(panel, options.focusScopes?.() ?? []).focus({ preventScroll: true });
            const release = modal() || toValue(options.blockScroll) ? lockScroll() : undefined;
            onCleanup(() => {
                release?.();
                // Give focus back only if it is still ours to give: in the closing
                // panel, or nowhere. A modeless dialog closed by a press elsewhere
                // leaves focus where that press put it.
                const active = document.activeElement;
                const ours = !active || active === document.body || panel.contains(active);
                if (ours && returnTo?.isConnected) returnTo.focus({ preventScroll: true });
            });
        },
        { flush: 'post' }
    );

    let pressedOnMask = false;
    return {
        onMaskPointerdown(event: PointerEvent) {
            pressedOnMask = event.target === event.currentTarget;
        },
        onMaskClick(event: MouseEvent) {
            const onMask = pressedOnMask && event.target === event.currentTarget;
            pressedOnMask = false;
            if (onMask && toValue(options.dismissableMask)) options.onClose('mask');
        }
    };
}
