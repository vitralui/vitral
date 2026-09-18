import { createFocusTrap, type FocusTrapOptions } from '@vitral/core';
import { toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue';

/** Traps Tab inside `container` while it is mounted and `active` is true; releases and restores focus otherwise. */
export function useFocusTrap(container: Ref<HTMLElement | null | undefined>, active: MaybeRefOrGetter<boolean> = true, options: FocusTrapOptions = {}): void {
    watch(
        [() => container.value, () => toValue(active)],
        ([el, on], _previous, onCleanup) => {
            if (!el || !on) return;
            const trap = createFocusTrap(el, options);
            trap.activate();
            onCleanup(() => trap.deactivate());
        },
        { flush: 'post' }
    );
}
