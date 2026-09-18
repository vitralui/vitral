import { rovingIndex, rovingMove } from '@vitral/core';
import { onBeforeUnmount, onMounted, type Ref } from 'vue';

/**
 * The toolbar keyboard for a container of buttons: exactly one of them is
 * tabbable, the arrows (and Home/End) move between the enabled ones, and
 * Escape hands focus back. Buttons come, go and get disabled as the
 * selection moves, so the tab stop is kept on an enabled one.
 */
export function useRoving(container: Ref<HTMLElement | null>, options: { onEscape?: () => void } = {}) {
    let active: HTMLElement | null = null;
    let observer: MutationObserver | null = null;

    const stops = (): HTMLElement[] => {
        const root = container.value;
        if (!root) return [];
        return Array.from(root.querySelectorAll<HTMLElement>('button')).filter((b) => !(b as HTMLButtonElement).disabled && b.closest('[role="toolbar"]') === root);
    };

    function sync() {
        const list = stops();
        if (!active || !list.includes(active)) active = list[0] ?? null;
        for (const b of list) {
            const index = b === active ? 0 : -1;
            if (b.tabIndex !== index) b.tabIndex = index;
        }
    }

    function onKeydown(event: KeyboardEvent) {
        if (event.defaultPrevented) return;
        const target = event.target as HTMLElement;
        if (event.key === 'Escape') {
            if (options.onEscape) {
                event.preventDefault();
                options.onEscape();
            }
            return;
        }
        if (target.closest('input, textarea, select, [contenteditable="true"]')) return;
        const root = container.value;
        const move = rovingMove(event.key, { orientation: 'horizontal', rtl: !!root && getComputedStyle(root).direction === 'rtl' });
        if (!move) return;
        const list = stops();
        const index = list.indexOf(target);
        if (index < 0) return;
        event.preventDefault();
        const next = list[rovingIndex(move, list.length, index)];
        if (!next) return;
        active = next;
        sync();
        next.focus();
    }

    function onFocusin(event: FocusEvent) {
        const target = event.target as HTMLElement;
        if (target !== active && stops().includes(target)) {
            active = target;
            sync();
        }
    }

    onMounted(() => {
        if (typeof MutationObserver === 'undefined' || !container.value) return;
        observer = new MutationObserver(sync);
        observer.observe(container.value, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled'] });
        sync();
    });
    onBeforeUnmount(() => observer?.disconnect());

    return { sync, onKeydown, onFocusin };
}
