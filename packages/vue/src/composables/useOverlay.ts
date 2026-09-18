import { anchorTo, pushLayer, ZIndex, type Placement, type ZIndexConfig } from '@vitral/core';
import { toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue';
import { useVitral } from '../config/config';

export interface UseOverlayOptions {
    /** The element the overlay attaches to and treats as part of itself. */
    anchor?: MaybeRefOrGetter<HTMLElement | null | undefined>;
    /** The overlay element; the overlay is live exactly while this ref holds an element. */
    overlay: Ref<HTMLElement | null | undefined>;
    /** Attach to the anchor. Off for overlays that position themselves, such as dialogs. */
    position?: boolean;
    placement?: MaybeRefOrGetter<Placement>;
    offset?: number;
    matchWidth?: boolean;
    flip?: boolean;
    zIndexKey?: keyof ZIndexConfig;
    onEscape?: (event: KeyboardEvent) => void;
    onPointerDownOutside?: (event: PointerEvent) => void;
}

/**
 * Everything a popup needs while it is on screen: attached to its anchor,
 * stacked above what was opened before it, and closed by Escape or a press
 * outside, but only when it is the topmost layer. It all starts when the
 * overlay element appears and is undone when it goes, so a component only has
 * to render the element conditionally.
 */
export function useOverlay(options: UseOverlayOptions): void {
    const { config } = useVitral();
    watch(
        () => options.overlay.value,
        (el, _previous, onCleanup) => {
            if (!el) return;
            const cleanups: (() => void)[] = [];
            const anchor = toValue(options.anchor);
            if (options.position !== false && anchor) {
                cleanups.push(
                    anchorTo(anchor, el, {
                        placement: toValue(options.placement) ?? 'bottom-start',
                        offset: options.offset,
                        matchWidth: options.matchWidth,
                        flip: options.flip
                    })
                );
            }
            const key = options.zIndexKey ?? 'overlay';
            ZIndex.set(key, el, config.zIndex[key]);
            // Vue nulls the ref when the leave transition *starts*; keep the
            // stacking until the element actually leaves the document, or a
            // fading popup drops under positioned content for its last frames.
            const frame = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : (fn: () => void) => setTimeout(fn, 16);
            const release = () => (el.isConnected ? frame(release) : ZIndex.clear(el));
            cleanups.push(release);
            if (options.onEscape || options.onPointerDownOutside) {
                cleanups.push(
                    pushLayer({
                        elements: () => [toValue(options.anchor), el],
                        onEscape: options.onEscape,
                        onPointerDownOutside: options.onPointerDownOutside
                    })
                );
            }
            onCleanup(() => cleanups.forEach((cleanup) => cleanup()));
        },
        { flush: 'post' }
    );
}
