/**
 * Which of a long run of items to draw: the rows of a grid that scrolls, or
 * its columns. Nothing here knows about the DOM; it is handed the size of each
 * item and the stretch in view, and answers with the items to draw and the
 * room to leave for the ones it leaves out, so the scrollbar is as long as if
 * every one were there.
 */

export interface VirtualWindow {
    /** The first item drawn. */
    start: number;
    /** One past the last item drawn. */
    end: number;
    /** The room the items before `start` would take. */
    before: number;
    /** The room the items from `end` on would take. */
    after: number;
    /** The room every item takes. */
    total: number;
}

/** Where each item begins, and at the end where the last one ends: `count + 1` offsets. */
export function offsetsOf(count: number, size: (index: number) => number): Float64Array {
    const out = new Float64Array(count + 1);
    for (let i = 0; i < count; i++) out[i + 1] = out[i]! + size(i);
    return out;
}

/** The last item that begins at or before `at`. */
function itemAt(offsets: Float64Array, at: number): number {
    const count = offsets.length - 1;
    let low = 0;
    let high = count - 1;
    while (low < high) {
        const mid = (low + high + 1) >> 1;
        if (offsets[mid]! <= at) low = mid;
        else high = mid - 1;
    }
    return Math.max(0, low);
}

/**
 * The items that cover the stretch from `from` to `to`, with `overscan` more
 * at either end, so a quick scroll shows rows rather than a gap while the next
 * ones are drawn.
 */
export function windowOf(offsets: Float64Array, from: number, to: number, overscan = 0): VirtualWindow {
    const count = offsets.length - 1;
    const total = offsets[count] ?? 0;
    if (count <= 0) return { start: 0, end: 0, before: 0, after: 0, total };
    const first = itemAt(offsets, Math.max(0, from));
    let last = itemAt(offsets, Math.max(from, to));
    // An item that ends exactly where the view does is not in it.
    if (last > first && offsets[last]! >= to) last--;
    const start = Math.max(0, first - overscan);
    const end = Math.min(count, last + 1 + overscan);
    return { start, end, before: offsets[start]!, after: total - offsets[end]!, total };
}
