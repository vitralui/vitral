/**
 * What a reader does to a table's columns: widen one, move it, stick it to an
 * edge, take it out of the way. All of it is one plain object — the layout —
 * which an application can store and hand back, and all of it is arithmetic,
 * so the table only has to draw the answer.
 */

export type ColumnSide = 'left' | 'right';

export interface ColumnLayout {
    /** The order columns are drawn in, by key. Keys left out keep their declared order, after the ones named. */
    order?: string[];
    /** Widths in pixels, by key. A column with no width is laid out by the table. */
    widths?: Record<string, number>;
    /** Keys that are not drawn. */
    hidden?: string[];
    /** Keys stuck to an edge while the rest scrolls. */
    pinned?: Record<string, ColumnSide>;
}

export interface ColumnResizeOptions {
    /** The smallest a column may be, in pixels. Defaults to `MIN_COLUMN_WIDTH`. */
    min?: number;
    /**
     * `'expand'` widens the table; `'fit'` takes what one column gains from the
     * next one, so the table's width does not change.
     */
    mode?: 'expand' | 'fit';
    /** The key after the one being resized, for `'fit'`. */
    next?: string;
    /** What a column measures when the layout has no width for it. */
    measured?: Record<string, number>;
}

const clean = (layout: ColumnLayout | null | undefined): Required<ColumnLayout> => ({
    order: layout?.order ?? [],
    widths: layout?.widths ?? {},
    hidden: layout?.hidden ?? [],
    pinned: layout?.pinned ?? {}
});

/**
 * The keys to draw, in order: the pinned ones first and last, the rest between
 * them in the order the layout gives, and anything the layout does not mention
 * where it was declared.
 */
export function orderColumns(keys: readonly string[], layout?: ColumnLayout | null): string[] {
    const { order, hidden, pinned } = clean(layout);
    const known = new Set(keys);
    const named = order.filter((key) => known.has(key));
    const rest = keys.filter((key) => !named.includes(key));
    const all = [...named, ...rest].filter((key) => !hidden.includes(key));
    const side = (key: string) => pinned[key];
    return [...all.filter((key) => side(key) === 'left'), ...all.filter((key) => !side(key)), ...all.filter((key) => side(key) === 'right')];
}

/** Whether a column is drawn. */
export function isColumnVisible(key: string, layout?: ColumnLayout | null): boolean {
    return !clean(layout).hidden.includes(key);
}

/** Shows or hides one column; without `visible` it swaps. */
export function toggleColumn(layout: ColumnLayout | null | undefined, key: string, visible?: boolean): ColumnLayout {
    const current = clean(layout);
    const isHidden = current.hidden.includes(key);
    const hide = visible === undefined ? !isHidden : !visible;
    if (hide === isHidden) return { ...current };
    return { ...current, hidden: hide ? [...current.hidden, key] : current.hidden.filter((k) => k !== key) };
}

/**
 * Moves a column so that it lands before `before`, or to the end when that is
 * absent. The order is written out in full, so what was implied by the
 * declaration order becomes explicit the first time anything moves.
 */
export function moveColumn(layout: ColumnLayout | null | undefined, keys: readonly string[], key: string, before: string | null): ColumnLayout {
    const current = clean(layout);
    const order = orderColumns(keys, { ...current, hidden: [] });
    // A move that is not a move leaves the layout as it was, rather than
    // writing an order out for nothing.
    if (!order.includes(key) || key === before) return { ...current };
    const without = order.filter((k) => k !== key);
    const at = before === null ? without.length : without.indexOf(before);
    if (before !== null && at === -1) return { ...current };
    return { ...current, order: [...without.slice(0, at), key, ...without.slice(at)] };
}

/** Sticks a column to an edge, or lets it go with `null`. */
export function pinColumn(layout: ColumnLayout | null | undefined, key: string, side: ColumnSide | null): ColumnLayout {
    const current = clean(layout);
    const pinned = { ...current.pinned };
    if (side) pinned[key] = side;
    else delete pinned[key];
    return { ...current, pinned };
}

/** The narrowest a column goes when nothing narrower is asked for, in pixels. */
export const MIN_COLUMN_WIDTH = 48;

/**
 * A column's new width after a drag of `delta` pixels. In `'fit'` mode the
 * next column gives up what this one takes, so neither goes below the minimum
 * and the table keeps its width.
 */
export function resizeColumn(layout: ColumnLayout | null | undefined, key: string, delta: number, options: ColumnResizeOptions = {}): ColumnLayout {
    const current = clean(layout);
    const min = options.min ?? MIN_COLUMN_WIDTH;
    const widthOf = (k: string) => current.widths[k] ?? options.measured?.[k] ?? min;
    const widths = { ...current.widths };
    const from = widthOf(key);
    if (options.mode === 'fit' && options.next) {
        const nextFrom = widthOf(options.next);
        // Neither end may cross its minimum, so the movement is clamped before
        // it is shared out: half a drag on each column is not what was asked.
        const room = Math.max(min - from, Math.min(delta, nextFrom - min));
        widths[key] = from + room;
        widths[options.next] = nextFrom - room;
    } else {
        widths[key] = Math.max(min, from + delta);
    }
    return { ...current, widths };
}

export interface ColumnSticky {
    side: ColumnSide;
    /** Distance from that edge, in pixels. */
    offset: number;
    /** The last pinned column on its side: the one that casts the shadow. */
    last: boolean;
}

/**
 * Where each pinned column sits: a left-pinned column stands after the ones
 * pinned before it, a right-pinned one before those pinned after it. Columns
 * that are not pinned are not in the answer.
 */
export function stickyOffsets(ordered: readonly string[], layout: ColumnLayout | null | undefined, measured: Record<string, number> = {}, fallback = 0): Record<string, ColumnSticky> {
    const { widths, pinned } = clean(layout);
    const width = (key: string) => widths[key] ?? measured[key] ?? fallback;
    const out: Record<string, ColumnSticky> = {};
    const left = ordered.filter((key) => pinned[key] === 'left');
    const right = ordered.filter((key) => pinned[key] === 'right');
    let at = 0;
    left.forEach((key, i) => {
        out[key] = { side: 'left', offset: at, last: i === left.length - 1 };
        at += width(key);
    });
    at = 0;
    for (let i = right.length - 1; i >= 0; i--) {
        const key = right[i]!;
        out[key] = { side: 'right', offset: at, last: i === 0 };
        at += width(key);
    }
    return out;
}

/** Where a column would land if it were dropped at `x` over the header. */
export function dropTarget(edges: readonly { key: string; left: number; right: number }[], x: number): string | null {
    for (const edge of edges) {
        if (x < edge.left + (edge.right - edge.left) / 2) return edge.key;
    }
    return null;
}
