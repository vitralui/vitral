/**
 * Moving items within a list and between two lists — what an order list and a
 * pick list do, by button, key or drag. The functions are pure: they return
 * the new lists and where the moved items ended up, so a component can keep
 * them selected and say where they went.
 */
export type ReorderDirection = 'up' | 'down' | 'top' | 'bottom';

export interface ReorderResult<T> {
    list: T[];
    /** The moved items' new indices, in list order. */
    indices: number[];
}

/**
 * Moves the items at `indices` one step, or to an end, keeping their order
 * among themselves. A block already against the edge stays; the others still
 * move, closing up behind it.
 */
export function moveItems<T>(list: readonly T[], indices: readonly number[], direction: ReorderDirection): ReorderResult<T> {
    const chosen = [...new Set(indices)].filter((i) => i >= 0 && i < list.length).sort((a, b) => a - b);
    if (chosen.length === 0) return { list: [...list], indices: [] };
    if (direction === 'top' || direction === 'bottom') {
        const picked = chosen.map((i) => list[i]!);
        const rest = list.filter((_, i) => !chosen.includes(i));
        const next = direction === 'top' ? [...picked, ...rest] : [...rest, ...picked];
        const start = direction === 'top' ? 0 : rest.length;
        return { list: next, indices: picked.map((_, k) => start + k) };
    }
    const next = [...list];
    const result: number[] = [];
    if (direction === 'up') {
        // `limit` is the highest free place: an item reaches it only if nothing moved there before it.
        let limit = 0;
        for (const index of chosen) {
            if (index > limit) {
                [next[index - 1], next[index]] = [next[index]!, next[index - 1]!];
                result.push(index - 1);
                limit = index;
            } else {
                result.push(index);
                limit = index + 1;
            }
        }
    } else {
        let limit = next.length - 1;
        for (const index of [...chosen].reverse()) {
            if (index < limit) {
                [next[index + 1], next[index]] = [next[index]!, next[index + 1]!];
                result.push(index + 1);
                limit = index;
            } else {
                result.push(index);
                limit = index - 1;
            }
        }
    }
    return { list: next, indices: result.sort((a, b) => a - b) };
}

/** Moves one item from `from` to `to` (its index after the move) — a drag and drop. */
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
    const next = [...list];
    if (from < 0 || from >= next.length) return next;
    const [item] = next.splice(from, 1);
    next.splice(Math.max(0, Math.min(next.length, to)), 0, item!);
    return next;
}

export interface TransferResult<T> {
    source: T[];
    target: T[];
    /** Where the moved items are in `target`. */
    indices: number[];
}

/** Moves the items at `indices` from `source` to the end of `target`, in their order. */
export function transferItems<T>(source: readonly T[], target: readonly T[], indices: readonly number[]): TransferResult<T> {
    const chosen = [...new Set(indices)].filter((i) => i >= 0 && i < source.length).sort((a, b) => a - b);
    const picked = chosen.map((i) => source[i]!);
    return {
        source: source.filter((_, i) => !chosen.includes(i)),
        target: [...target, ...picked],
        indices: picked.map((_, k) => target.length + k)
    };
}
