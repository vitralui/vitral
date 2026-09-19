import { onBeforeUnmount } from 'vue';

/**
 * Follows one pointer until it is lifted, from the document rather than from
 * the element it started on.
 *
 * `setPointerCapture` is the tidier way to say this, and it is the one that
 * lets go: WebKit drops a capture when the captured element is re-rendered,
 * which is exactly what a control does while it is being dragged — the value
 * changes, the thumb moves, and the finger is suddenly dragging nothing. The
 * document hears every move wherever the finger goes, in every engine, and a
 * pointer id keeps a second finger out of it.
 */
export interface PointerTracking {
    move?: (event: PointerEvent) => void;
    end?: (event: PointerEvent) => void;
    cancel?: (event: PointerEvent) => void;
}

export function useDrag() {
    let stop: (() => void) | null = null;

    /** Call from a `pointerdown` handler; returns the function that stops it. */
    function track(pointerId: number, handlers: PointerTracking): () => void {
        release();
        const forThis = (fn?: (event: PointerEvent) => void) => (event: Event) => {
            const pointer = event as PointerEvent;
            if (pointer.pointerId === pointerId) fn?.(pointer);
        };
        const onMove = forThis(handlers.move);
        const onEnd = (event: Event) => {
            const pointer = event as PointerEvent;
            if (pointer.pointerId !== pointerId) return;
            release();
            handlers.end?.(pointer);
        };
        const onCancel = (event: Event) => {
            const pointer = event as PointerEvent;
            if (pointer.pointerId !== pointerId) return;
            release();
            (handlers.cancel ?? handlers.end)?.(pointer);
        };
        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onEnd);
        document.addEventListener('pointercancel', onCancel);
        stop = () => {
            document.removeEventListener('pointermove', onMove);
            document.removeEventListener('pointerup', onEnd);
            document.removeEventListener('pointercancel', onCancel);
            stop = null;
        };
        return release;
    }

    function release() {
        stop?.();
    }

    onBeforeUnmount(release);

    return { track, release, dragging: () => !!stop };
}
