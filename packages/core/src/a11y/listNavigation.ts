import { normalizeText } from '../data/filter';

export type IsDisabled = (index: number) => boolean;

const never: IsDisabled = () => false;

/**
 * The next enabled index from `from` in direction `step`. At either end it stays
 * put unless `loop` is set — a listbox stops at its edges, a menu wraps.
 * Returns `from` when nothing else is enabled.
 */
export function stepIndex(count: number, from: number, step: 1 | -1, isDisabled: IsDisabled = never, loop = false): number {
    if (count <= 0) return -1;
    let index = from;
    for (let n = 0; n < count; n++) {
        index += step;
        if (index < 0 || index >= count) {
            if (!loop) return from;
            index = (index + count) % count;
        }
        if (!isDisabled(index)) return index;
    }
    return from;
}

export function firstIndex(count: number, isDisabled: IsDisabled = never): number {
    for (let i = 0; i < count; i++) if (!isDisabled(i)) return i;
    return -1;
}

export function lastIndex(count: number, isDisabled: IsDisabled = never): number {
    for (let i = count - 1; i >= 0; i--) if (!isDisabled(i)) return i;
    return -1;
}

/**
 * The option a typeahead query lands on, searching after `from` and wrapping.
 * A query of one repeated character ("aaa") cycles through the options that
 * start with it, which is how native selects behave.
 */
export function typeaheadIndex(labels: readonly string[], query: string, from: number, isDisabled: IsDisabled = never, locale?: string): number {
    const count = labels.length;
    if (count === 0 || query === '') return -1;
    const repeated = query.length > 1 && [...query].every((c) => c === query[0]);
    const needle = normalizeText(repeated ? query[0] : query, locale);
    const start = repeated || query.length === 1 ? from + 1 : Math.max(from, 0);
    for (let n = 0; n < count; n++) {
        const index = (start + n) % count;
        if (!isDisabled(index) && normalizeText(labels[index] ?? '', locale).startsWith(needle)) return index;
    }
    return -1;
}
