interface Entry {
    key: string;
    el: HTMLElement;
    value: number;
}

const entries: Entry[] = [];

/**
 * Hands out stacking order. Every layer goes above the last one opened, of any
 * kind, and never below its own base, so a select opened inside a modal dialog
 * lands on top of the dialog even though overlays start lower than modals.
 */
export const ZIndex = {
    set(key: string, el: HTMLElement, base: number): number {
        const last = entries[entries.length - 1];
        const value = Math.max(base, last ? last.value + 1 : base);
        entries.push({ key, el, value });
        el.style.zIndex = String(value);
        return value;
    },
    clear(el: HTMLElement | null | undefined): void {
        if (!el) return;
        const index = entries.findIndex((entry) => entry.el === el);
        if (index >= 0) entries.splice(index, 1);
        el.style.zIndex = '';
    },
    get(el: HTMLElement | null | undefined): number {
        return el ? Number(el.style.zIndex) || 0 : 0;
    }
};
