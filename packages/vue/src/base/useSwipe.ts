import { swipeStep } from '@vitral/core';
import { computed, ref, type MaybeRefOrGetter, toValue } from 'vue';

// Pointer dragging for a paged track: a carousel, a gallery. While the drag
// lasts, `offset` follows the pointer so the track can move with it; on
// release, a long enough drag along the axis pages once. A drag that moved
// swallows the click that ends it, so a slide's link is not followed by a
// swipe. The track should set `touch-action` to let the other axis scroll.

export interface UseSwipeOptions {
    vertical?: MaybeRefOrGetter<boolean>;
    disabled?: MaybeRefOrGetter<boolean>;
    onSwipe: (step: 1 | -1) => void;
}

export function useSwipe(options: UseSwipeOptions) {
    const start = ref<{ x: number; y: number; id: number } | null>(null);
    const delta = ref({ x: 0, y: 0 });
    let moved = false;

    const dragging = computed(() => start.value !== null);
    /** Pixels along the axis, for the track's transform. */
    const offset = computed(() => (toValue(options.vertical) ? delta.value.y : delta.value.x));

    function onPointerdown(event: PointerEvent) {
        if (toValue(options.disabled) || (event.pointerType === 'mouse' && event.button !== 0)) return;
        start.value = { x: event.clientX, y: event.clientY, id: event.pointerId };
        delta.value = { x: 0, y: 0 };
        moved = false;
    }

    function onPointermove(event: PointerEvent) {
        if (!start.value || event.pointerId !== start.value.id) return;
        delta.value = { x: event.clientX - start.value.x, y: event.clientY - start.value.y };
        if (!moved && Math.hypot(delta.value.x, delta.value.y) > 6) {
            moved = true;
            (event.currentTarget as Element).setPointerCapture?.(event.pointerId);
        }
    }

    function end(event: PointerEvent) {
        if (!start.value || event.pointerId !== start.value.id) return;
        const rtl = getComputedStyle(event.currentTarget as Element).direction === 'rtl';
        const step = swipeStep(delta.value.x, delta.value.y, { vertical: toValue(options.vertical), rtl });
        start.value = null;
        delta.value = { x: 0, y: 0 };
        if (step) options.onSwipe(step);
    }

    function onClickCapture(event: MouseEvent) {
        if (!moved) return;
        moved = false;
        event.preventDefault();
        event.stopPropagation();
    }

    const handlers = {
        onPointerdown,
        onPointermove,
        onPointerup: end,
        onPointercancel: (event: PointerEvent) => {
            if (start.value?.id !== event.pointerId) return;
            start.value = null;
            delta.value = { x: 0, y: 0 };
        },
        onClickCapture,
        // Images are draggable by default, which would steal the gesture.
        onDragstart: (event: DragEvent) => event.preventDefault()
    };

    return { dragging, offset, handlers };
}
