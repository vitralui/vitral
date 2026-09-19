import { autoScroll, pointerDrag, type AutoScrollOptions, type DragInfo, type DragOptions } from '@vitral/dom';
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
 * `@vitral/dom`'s auto-scroll, stopped when the component goes away: the
 * containers under a drag scroll while the pointer is near one of their edges,
 * and the window with them.
 */
export function useAutoScroll(options: AutoScrollOptions) {
    const scroller = autoScroll(options);
    onBeforeUnmount(scroller.stop);
    return scroller;
}
