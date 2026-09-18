import { anchorTo, ZIndex, type AnchorOptions, type ZIndexConfig } from '@vitral/core';
import { onBeforeUnmount, type VNode } from 'vue';
import { useVitral } from '../config/config';

// Submenus and mega-menu panels stay where they are in the DOM, inside the
// menu, so key and focus events bubble to its listeners and `contains()` still
// answers "is focus in the menu". They are placed with `position: fixed` by
// Floating UI. That takes them out of any ancestor's `overflow: hidden`, and
// flips them to the other side when the viewport has no room.

export interface AnchoredOptions extends AnchorOptions {
    /** The element to attach to. Defaults to the popup's previous sibling, the item that opened it. */
    reference?: (el: HTMLElement) => Element | null | undefined;
    /** Pull the popup back by its own top padding and border, so its first item sits level with the reference. */
    alignFirstItem?: boolean;
}

/**
 * Returns vnode hooks to spread on a popup element: while it is mounted it is
 * attached to its reference and stacked above what was opened before it.
 * `options` is read when the element mounts.
 */
export function useAnchored(zIndexKey: keyof ZIndexConfig = 'menu') {
    const { config } = useVitral();
    const live = new Map<HTMLElement, () => void>();

    function attach(el: HTMLElement, options: AnchoredOptions) {
        detach(el);
        const reference = options.reference ? options.reference(el) : el.previousElementSibling;
        if (!reference) return;
        const rtl = getComputedStyle(reference).direction === 'rtl';
        const placement = rtl ? mirror(options.placement ?? 'bottom-start') : options.placement;
        let alignmentOffset = options.alignmentOffset;
        if (options.alignFirstItem) {
            const style = getComputedStyle(el);
            alignmentOffset = -((parseFloat(style.paddingTop) || 0) + (parseFloat(style.borderTopWidth) || 0));
        }
        const release = anchorTo(reference, el, { strategy: 'fixed', ...options, placement, alignmentOffset });
        ZIndex.set(zIndexKey, el, config.zIndex[zIndexKey]);
        live.set(el, () => {
            release();
            ZIndex.clear(el);
            el.style.position = '';
            el.style.left = '';
            el.style.top = '';
        });
    }

    function detach(el: HTMLElement) {
        live.get(el)?.();
        live.delete(el);
    }

    onBeforeUnmount(() => {
        live.forEach((release) => release());
        live.clear();
    });

    /** Props for `h()` or `v-bind`: attach on mount, follow option changes, release on unmount. `false` leaves the element in the flow. */
    function hooks(options: AnchoredOptions | false) {
        return {
            onVnodeMounted: (vnode: VNode) => options && attach(vnode.el as HTMLElement, options),
            onVnodeUpdated: (vnode: VNode) => {
                const el = vnode.el as HTMLElement;
                if (!options) detach(el);
                else if (!live.has(el)) attach(el, options);
            },
            onVnodeBeforeUnmount: (vnode: VNode) => detach(vnode.el as HTMLElement)
        };
    }

    return { hooks, attach, detach };
}

// Floating UI already reads start/end as logical; only the physical sides swap.
function mirror<T extends string>(placement: T): T {
    return placement.replace(/left|right/, (side) => (side === 'left' ? 'right' : 'left')) as T;
}
