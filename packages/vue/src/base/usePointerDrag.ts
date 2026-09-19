import { edgeScrollSpeed } from '@vitral/core';
import { pointerDrag, type DragInfo, type DragOptions } from '@vitral/dom';
import { onBeforeUnmount, ref, type Ref } from 'vue';

// The drag is `@vitral/dom`'s, which every addon uses; this is the same thing
// with an `active` a template can read and a cancel when the component goes
// away. What it does — a press becomes a drag only after it travels
// `threshold` pixels, or after a finger rests for `touchDelay`, so a click
// stays a click and a swipe still scrolls — is documented there.

export type PointerDragInfo = DragInfo;
export type UsePointerDragOptions<T> = DragOptions<T>;

export function usePointerDrag<T>(options: UsePointerDragOptions<T>): {
    active: Ref<boolean>;
    press: (event: PointerEvent, value: T) => void;
    cancel: () => void;
    lastEvent: () => PointerEvent | null;
} {
    const active = ref(false);
    const drag = pointerDrag<T>({ ...options, onActive: (value) => (active.value = value) });
    onBeforeUnmount(drag.cancel);
    return { active, press: drag.press, cancel: drag.cancel, lastEvent: drag.lastEvent };
}

/**
 * Scrolls the containers under a drag while the pointer is near one of their
 * edges, and the window too, calling `onScroll` after each step so the drag
 * can look again at what is under the pointer.
 */
export function useAutoScroll(options: { containers: () => (Element | null | undefined)[]; onScroll?: () => void; edge?: number; speed?: number }) {
    let frame = 0;
    let point: { x: number; y: number } | null = null;

    function tick() {
        frame = 0;
        if (!point) return;
        let moved = false;
        const { edge = 48, speed = 18 } = options;
        for (const el of options.containers()) {
            if (!el) continue;
            const rect = el.getBoundingClientRect();
            const inside = point.x >= rect.left - edge && point.x <= rect.right + edge && point.y >= rect.top - edge && point.y <= rect.bottom + edge;
            if (!inside) continue;
            const canX = el.scrollWidth > el.clientWidth;
            const canY = el.scrollHeight > el.clientHeight;
            const dx = canX && point.y >= rect.top && point.y <= rect.bottom ? edgeScrollSpeed(point.x, rect.left, rect.right, edge, speed) : 0;
            const dy = canY && point.x >= rect.left && point.x <= rect.right ? edgeScrollSpeed(point.y, rect.top, rect.bottom, edge, speed) : 0;
            if (dx || dy) {
                const before = el.scrollLeft + el.scrollTop;
                el.scrollBy?.(dx, dy);
                if (el.scrollLeft + el.scrollTop !== before) moved = true;
            }
        }
        const dy = edgeScrollSpeed(point.y, 0, window.innerHeight, edge, speed);
        if (dy) {
            const before = window.scrollY;
            window.scrollBy?.(0, dy);
            if (window.scrollY !== before) moved = true;
        }
        if (moved) options.onScroll?.();
        frame = requestAnimationFrame(tick);
    }

    function update(x: number, y: number) {
        point = { x, y };
        if (!frame && typeof requestAnimationFrame === 'function') frame = requestAnimationFrame(tick);
    }

    function stop() {
        point = null;
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
    }

    onBeforeUnmount(stop);
    return { update, stop };
}
