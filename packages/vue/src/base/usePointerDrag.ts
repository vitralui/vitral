import { edgeScrollSpeed, isClient } from '@vitral/core';
import { onBeforeUnmount, ref } from 'vue';

// A pointer drag that works the same for a mouse, a pen and a finger. A press
// becomes a drag only after it travels `threshold` pixels, so a click stays a
// click; on touch it becomes one only after the finger rests for `touchDelay`
// milliseconds, so a swipe still scrolls the page. While a drag lasts the page
// does not scroll under the finger, Escape cancels it, and the click that ends
// it is swallowed. Movement is reported against the press, in client pixels.

export interface PointerDragInfo {
    x: number;
    y: number;
    dx: number;
    dy: number;
    event: PointerEvent;
}

export interface UsePointerDragOptions<T> {
    threshold?: number;
    /** Milliseconds a touch has to rest before it drags. */
    touchDelay?: number;
    /** Called once the press has become a drag; return false to refuse it. */
    onStart: (payload: T, info: PointerDragInfo) => boolean | void;
    onMove?: (payload: T, info: PointerDragInfo) => void;
    onEnd?: (payload: T, info: PointerDragInfo) => void;
    /** Escape, a cancelled pointer, or the component going away. */
    onCancel?: (payload: T) => void;
    /** A press that never became a drag. */
    onClick?: (payload: T, event: PointerEvent) => void;
}

export function usePointerDrag<T>(options: UsePointerDragOptions<T>) {
    const active = ref(false);
    let payload: T | null = null;
    let origin = { x: 0, y: 0, id: -1 };
    let pending = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let last: PointerEvent | null = null;
    let cleanup: (() => void) | null = null;

    const info = (event: PointerEvent): PointerDragInfo => ({ x: event.clientX, y: event.clientY, dx: event.clientX - origin.x, dy: event.clientY - origin.y, event });

    function begin(event: PointerEvent) {
        pending = false;
        if (options.onStart(payload as T, info(event)) === false) return finish();
        active.value = true;
        options.onMove?.(payload as T, info(event));
    }

    function onMove(event: PointerEvent) {
        if (event.pointerId !== origin.id) return;
        last = event;
        if (active.value) {
            options.onMove?.(payload as T, info(event));
            return;
        }
        const far = Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > (options.threshold ?? 4);
        if (!far || !pending) return;
        // A touch that moves before its delay is a scroll, not a drag.
        if (event.pointerType === 'touch' && (options.touchDelay ?? 0) > 0) return finish();
        begin(event);
    }

    function onUp(event: PointerEvent) {
        if (event.pointerId !== origin.id) return;
        if (active.value) {
            options.onEnd?.(payload as T, info(event));
            swallowClick();
        } else if (pending) {
            options.onClick?.(payload as T, event);
        }
        finish();
    }

    function onCancelEvent(event: PointerEvent) {
        if (event.pointerId === origin.id) cancel();
    }

    function onKeydown(event: KeyboardEvent) {
        if (event.key !== 'Escape' || !active.value) return;
        event.preventDefault();
        event.stopPropagation();
        cancel();
    }

    function onTouchmove(event: TouchEvent) {
        if (active.value && event.cancelable) event.preventDefault();
    }

    function swallowClick() {
        const stop = (e: Event) => {
            e.stopPropagation();
            e.preventDefault();
        };
        window.addEventListener('click', stop, { capture: true, once: true });
        setTimeout(() => window.removeEventListener('click', stop, { capture: true }), 0);
    }

    /** Call from a `pointerdown` handler. */
    function press(event: PointerEvent, value: T) {
        if (!isClient || (event.pointerType === 'mouse' && event.button !== 0)) return;
        finish();
        payload = value;
        origin = { x: event.clientX, y: event.clientY, id: event.pointerId };
        pending = true;
        last = event;
        const doc = document;
        doc.addEventListener('pointermove', onMove);
        doc.addEventListener('pointerup', onUp);
        doc.addEventListener('pointercancel', onCancelEvent);
        doc.addEventListener('keydown', onKeydown, true);
        doc.addEventListener('touchmove', onTouchmove, { passive: false });
        cleanup = () => {
            doc.removeEventListener('pointermove', onMove);
            doc.removeEventListener('pointerup', onUp);
            doc.removeEventListener('pointercancel', onCancelEvent);
            doc.removeEventListener('keydown', onKeydown, true);
            doc.removeEventListener('touchmove', onTouchmove);
        };
        if (event.pointerType === 'touch' && (options.touchDelay ?? 0) > 0) {
            timer = setTimeout(() => {
                if (pending && last) begin(last);
            }, options.touchDelay);
        }
    }

    function finish() {
        clearTimeout(timer);
        cleanup?.();
        cleanup = null;
        active.value = false;
        pending = false;
        payload = null;
    }

    function cancel() {
        const was = active.value;
        const value = payload;
        finish();
        if (was) options.onCancel?.(value as T);
    }

    onBeforeUnmount(cancel);

    return { active, press, cancel, lastEvent: () => last };
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
