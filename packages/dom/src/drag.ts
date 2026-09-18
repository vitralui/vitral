import { isClient } from '@vitral/core';

// A pointer drag that works the same for a mouse, a pen and a finger. A press
// becomes a drag only after it travels `threshold` pixels, so a click stays a
// click. While a drag lasts the page does not scroll under the finger, Escape
// cancels it, and the click that ends it is swallowed.

export interface DragInfo {
    x: number;
    y: number;
    dx: number;
    dy: number;
    event: PointerEvent;
}

export interface DragOptions<T> {
    threshold?: number;
    /** Called once the press has become a drag; return false to refuse it. */
    onStart: (payload: T, info: DragInfo) => boolean | void;
    onMove?: (payload: T, info: DragInfo) => void;
    onEnd?: (payload: T, info: DragInfo) => void;
    /** Escape, a cancelled pointer, or the component going away. */
    onCancel?: (payload: T) => void;
    /** The drag started or stopped. */
    onActive?: (active: boolean) => void;
}

export function pointerDrag<T>(options: DragOptions<T>) {
    let active = false;
    let payload: T | null = null;
    let origin = { x: 0, y: 0, id: -1 };
    let pending = false;
    let cleanup: (() => void) | null = null;

    const info = (event: PointerEvent): DragInfo => ({ x: event.clientX, y: event.clientY, dx: event.clientX - origin.x, dy: event.clientY - origin.y, event });

    const setActive = (value: boolean) => {
        if (active === value) return;
        active = value;
        options.onActive?.(value);
    };

    function begin(event: PointerEvent) {
        pending = false;
        if (options.onStart(payload as T, info(event)) === false) return finish();
        setActive(true);
        options.onMove?.(payload as T, info(event));
    }

    function onMove(event: PointerEvent) {
        if (event.pointerId !== origin.id) return;
        if (active) {
            options.onMove?.(payload as T, info(event));
            return;
        }
        const far = Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > (options.threshold ?? 4);
        if (far && pending) begin(event);
    }

    function onUp(event: PointerEvent) {
        if (event.pointerId !== origin.id) return;
        if (active) {
            options.onEnd?.(payload as T, info(event));
            swallowClick();
        }
        finish();
    }

    function onCancelEvent(event: PointerEvent) {
        if (event.pointerId === origin.id) cancel();
    }

    function onKeydown(event: KeyboardEvent) {
        if (event.key !== 'Escape' || !active) return;
        event.preventDefault();
        event.stopPropagation();
        cancel();
    }

    function onTouchmove(event: TouchEvent) {
        if (active && event.cancelable) event.preventDefault();
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
    }

    function finish() {
        cleanup?.();
        cleanup = null;
        pending = false;
        payload = null;
        setActive(false);
    }

    function cancel() {
        const was = active;
        const value = payload;
        finish();
        if (was) options.onCancel?.(value as T);
    }

    return { active: () => active, press, cancel };
}
