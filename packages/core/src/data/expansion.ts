/**
 * Which sections of an accordion-like widget are open: one key when a single
 * section may be open, a list of keys when several may. `null` or `undefined` means none.
 */
export type ExpansionValue<K> = K | K[] | null | undefined;

export function isExpanded<K>(value: ExpansionValue<K>, key: K): boolean {
    if (value === null || value === undefined) return false;
    return Array.isArray(value) ? value.includes(key) : value === key;
}

/**
 * The value after `key` is toggled. With `multiple` the list gains or loses the
 * key; without, the key becomes the only open one, or nothing when it was open.
 * A single value handed to a `multiple` widget, or a list to a single one, is
 * read as what it plainly means rather than rejected.
 */
export function toggleExpanded<K>(value: ExpansionValue<K>, key: K, multiple: boolean): K | K[] | null {
    const open = isExpanded(value, key);
    if (multiple) {
        const list = value === null || value === undefined ? [] : Array.isArray(value) ? value : [value];
        return open ? list.filter((k) => k !== key) : [...list, key];
    }
    return open ? null : key;
}
