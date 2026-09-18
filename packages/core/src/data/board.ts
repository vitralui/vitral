/**
 * The arithmetic of a task board — cards in columns, optionally split into
 * swimlanes — with no DOM in it. A board is kept as one flat, ordered list of
 * entries, each saying which column (and lane) it is in; a cell's cards are the
 * entries of that cell in list order. Every move is a pure function of that
 * list, so a board fed as nested columns and one fed as a flat list of items
 * share the same moves, the same limits and the same keyboard.
 */

export type BoardKey = string | number;

export interface BoardEntry<T = unknown> {
    item: T;
    column: BoardKey;
    /** The swimlane; `undefined` on a board without lanes. */
    lane?: BoardKey;
}

/** Where a card is: its column, its lane, and its place among that cell's cards. */
export interface BoardPosition {
    column: BoardKey;
    lane?: BoardKey;
    index: number;
}

const sameCell = (entry: { column: BoardKey; lane?: BoardKey }, column: BoardKey, lane: BoardKey | undefined) => entry.column === column && entry.lane === lane;

/** The entries of one cell, in order, with their indices in the flat list. */
export function cellEntries<T>(entries: readonly BoardEntry<T>[], column: BoardKey, lane?: BoardKey): { entry: BoardEntry<T>; at: number }[] {
    const out: { entry: BoardEntry<T>; at: number }[] = [];
    entries.forEach((entry, at) => {
        if (sameCell(entry, column, lane)) out.push({ entry, at });
    });
    return out;
}

/** Where the entry at flat index `at` sits in its cell. */
export function positionOf(entries: readonly BoardEntry[], at: number): BoardPosition | null {
    const entry = entries[at];
    if (!entry) return null;
    let index = 0;
    for (let i = 0; i < at; i++) if (sameCell(entries[i]!, entry.column, entry.lane)) index++;
    return { column: entry.column, lane: entry.lane, index };
}

/** How many cards a column holds across every lane, optionally not counting one entry (the one being dragged). */
export function columnCount(entries: readonly BoardEntry[], column: BoardKey, except = -1): number {
    let count = 0;
    entries.forEach((entry, i) => {
        if (entry.column === column && i !== except) count++;
    });
    return count;
}

/**
 * Moves the entry at flat index `from` to `to`, where `to.index` is its place
 * among the target cell's *other* cards. The entry takes the target's column
 * and lane; `relabel` lets the caller copy the item with its fields updated.
 * Returns the new list and the entry's new flat index.
 */
export function moveCard<T>(
    entries: readonly BoardEntry<T>[],
    from: number,
    to: BoardPosition,
    relabel?: (item: T, column: BoardKey, lane: BoardKey | undefined) => T
): { entries: BoardEntry<T>[]; at: number } {
    const list = [...entries];
    const moving = list[from];
    if (!moving) return { entries: list, at: from };
    list.splice(from, 1);
    const changed = moving.column !== to.column || moving.lane !== to.lane;
    const entry: BoardEntry<T> = {
        item: changed && relabel ? relabel(moving.item, to.column, to.lane) : moving.item,
        column: to.column,
        lane: to.lane
    };
    const cell = cellEntries(list, to.column, to.lane);
    const index = Math.max(0, Math.min(to.index, cell.length));
    let at: number;
    if (index < cell.length) at = cell[index]!.at;
    else if (cell.length) at = cell[cell.length - 1]!.at + 1;
    else at = changed ? list.length : Math.min(from, list.length);
    list.splice(at, 0, entry);
    return { entries: list, at };
}

/** A column against its work-in-progress limit. */
export type WipState = 'under' | 'at' | 'over';

export function wipState(count: number, limit?: number | null): WipState {
    if (limit === undefined || limit === null || limit < 0) return 'under';
    if (count > limit) return 'over';
    return count === limit ? 'at' : 'under';
}

/** Whether a column with `count` other cards can take one more: moving within a column never counts against its limit. */
export function wipAllows(count: number, limit: number | null | undefined, sameColumn: boolean): boolean {
    if (sameColumn || limit === undefined || limit === null || limit < 0) return true;
    return count < limit;
}

export interface BoardLayout {
    /** Column keys in display order. */
    columns: readonly BoardKey[];
    /** Lane keys in display order; `[undefined]` for a board without lanes. */
    lanes: readonly (BoardKey | undefined)[];
    /** Columns (or lanes) a card cannot be moved to by the keyboard — collapsed, locked. */
    skipColumn?: (column: BoardKey) => boolean;
    skipLane?: (lane: BoardKey | undefined) => boolean;
}

/**
 * Where a key takes a picked-up card, following the accessible drag-and-drop
 * pattern: Up/Down through the cell, Home/End to its ends, Left/Right to the
 * neighbouring column (keeping the row when it can), PageUp/PageDown — or
 * Ctrl with Up/Down — to the neighbouring lane. `count(column, lane)` is the
 * number of cards already in a cell, not counting the one that moves. Null for
 * a key the pattern does not use; the same position when there is nowhere to go.
 */
export function boardMoveTarget(
    position: BoardPosition,
    key: string,
    layout: BoardLayout,
    count: (column: BoardKey, lane: BoardKey | undefined) => number,
    modifiers: { ctrlKey?: boolean; rtl?: boolean } = {}
): BoardPosition | null {
    const { column, lane, index } = position;
    const size = count(column, lane);
    const step = (list: readonly (BoardKey | undefined)[], current: BoardKey | undefined, delta: 1 | -1, skip?: (key: never) => boolean) => {
        let i = list.indexOf(current);
        for (;;) {
            i += delta;
            if (i < 0 || i >= list.length) return null;
            if (!skip?.(list[i] as never)) return { key: list[i] };
        }
    };
    const toLane = (delta: 1 | -1): BoardPosition => {
        const next = step(layout.lanes, lane, delta, layout.skipLane as never);
        if (!next) return position;
        return { column, lane: next.key, index: Math.min(index, count(column, next.key)) };
    };
    let key_ = key;
    if (modifiers.rtl && (key === 'ArrowLeft' || key === 'ArrowRight')) key_ = key === 'ArrowLeft' ? 'ArrowRight' : 'ArrowLeft';
    switch (key_) {
        case 'ArrowUp':
            if (modifiers.ctrlKey) return toLane(-1);
            return { column, lane, index: Math.max(0, index - 1) };
        case 'ArrowDown':
            if (modifiers.ctrlKey) return toLane(1);
            return { column, lane, index: Math.min(size, index + 1) };
        case 'Home':
            return { column, lane, index: 0 };
        case 'End':
            return { column, lane, index: size };
        case 'PageUp':
            return toLane(-1);
        case 'PageDown':
            return toLane(1);
        case 'ArrowLeft':
        case 'ArrowRight': {
            const next = step(layout.columns, column, key_ === 'ArrowLeft' ? -1 : 1, layout.skipColumn as never);
            if (!next) return position;
            const target = next.key as BoardKey;
            return { column: target, lane, index: Math.min(index, count(target, lane)) };
        }
        default:
            return null;
    }
}

/**
 * Where focus goes when a key moves between cards (nothing picked up): the
 * same arrows, but only onto cells that have a card, landing on the nearest
 * row. Returns null for a key it does not handle or when there is nowhere to go.
 */
export function boardFocusTarget(
    position: BoardPosition,
    key: string,
    layout: BoardLayout,
    count: (column: BoardKey, lane: BoardKey | undefined) => number,
    modifiers: { ctrlKey?: boolean; rtl?: boolean } = {}
): BoardPosition | null {
    const { column, lane, index } = position;
    const size = count(column, lane);
    let key_ = key;
    if (modifiers.rtl && (key === 'ArrowLeft' || key === 'ArrowRight')) key_ = key === 'ArrowLeft' ? 'ArrowRight' : 'ArrowLeft';
    const search = (list: readonly (BoardKey | undefined)[], current: BoardKey | undefined, delta: 1 | -1, at: (key: BoardKey | undefined) => BoardPosition, skip?: (key: never) => boolean) => {
        for (let i = list.indexOf(current) + delta; i >= 0 && i < list.length; i += delta) {
            if (skip?.(list[i] as never)) continue;
            const target = at(list[i]);
            if (count(target.column, target.lane) > 0) return { ...target, index: Math.min(index, count(target.column, target.lane) - 1) };
        }
        return null;
    };
    switch (key_) {
        case 'ArrowUp':
            if (modifiers.ctrlKey) return search(layout.lanes, lane, -1, (l) => ({ column, lane: l, index }), layout.skipLane as never);
            return index > 0 ? { column, lane, index: index - 1 } : null;
        case 'ArrowDown':
            if (modifiers.ctrlKey) return search(layout.lanes, lane, 1, (l) => ({ column, lane: l, index }), layout.skipLane as never);
            return index < size - 1 ? { column, lane, index: index + 1 } : null;
        case 'Home':
            return size ? { column, lane, index: 0 } : null;
        case 'End':
            return size ? { column, lane, index: size - 1 } : null;
        case 'PageUp':
        case 'PageDown':
            return search(layout.lanes, lane, key_ === 'PageUp' ? -1 : 1, (l) => ({ column, lane: l, index }), layout.skipLane as never);
        case 'ArrowLeft':
        case 'ArrowRight':
            return search(layout.columns, column, key_ === 'ArrowLeft' ? -1 : 1, (c) => ({ column: c as BoardKey, lane, index }), layout.skipColumn as never);
        default:
            return null;
    }
}

/**
 * The insertion index for a pointer at `position` along a list whose items'
 * midpoints are `midpoints` (the dragged item left out): the number of items
 * whose middle is before the pointer.
 */
export function insertionIndex(midpoints: readonly number[], position: number): number {
    let index = 0;
    for (const mid of midpoints) if (position > mid) index++;
    return index;
}

/**
 * How fast to scroll while dragging near an edge, in pixels per frame: zero
 * outside the `edge` band, rising linearly to `max` at the edge itself.
 * Negative scrolls toward `start`.
 */
export function edgeScrollSpeed(position: number, start: number, end: number, edge = 40, max = 16): number {
    if (end - start <= 0 || edge <= 0) return 0;
    const band = Math.min(edge, (end - start) / 3);
    if (position < start + band) return -Math.round(max * Math.min(1, (start + band - position) / band));
    if (position > end - band) return Math.round(max * Math.min(1, (position - (end - band)) / band));
    return 0;
}
