import { columnIndex, normalizeRange, rangeContains, sameAddress } from './a1';
import type { CellAddress, CellRange } from './types';

/**
 * What the grid draws, worked out from what it was told: how wide every
 * column is and where it starts, which rows and columns are on screen, and
 * where the selection is after a key. No DOM and no timers — the renderer
 * only has to draw the answer.
 */

export interface MetricsOptions {
    rows: number;
    columns: number;
    /** The width of a column that was never resized. */
    columnWidth?: number;
    rowHeight?: number;
    /** Widths in pixels by column letter, heights by row number as a person counts them. */
    columnWidths?: Record<string, number>;
    rowHeights?: Record<number, number>;
}

/** One axis: sizes that are mostly the same, with a few that are not. */
interface Axis {
    count: number;
    size: (index: number) => number;
    offset: (index: number) => number;
    /** Which index a position falls in, clamped to the axis. */
    at: (position: number) => number;
    total: number;
}

function createAxis(count: number, base: number, overrides: Map<number, number>): Axis {
    // The overrides in order, with how much each one adds over the usual size:
    // a position is then the usual arithmetic plus what came before it.
    const list = [...overrides.entries()]
        .filter(([index]) => index >= 0 && index < count)
        .sort((a, b) => a[0] - b[0])
        .map(([index, size]) => ({ index, size, extra: size - base }));

    const size = (index: number) => overrides.get(index) ?? base;
    const offset = (index: number) => {
        let extra = 0;
        for (const entry of list) {
            if (entry.index >= index) break;
            extra += entry.extra;
        }
        return index * base + extra;
    };
    const total = count * base + list.reduce((sum, entry) => sum + entry.extra, 0);

    return {
        count,
        size,
        offset,
        total,
        at(position) {
            if (position <= 0) return 0;
            let start = 0;
            let index = 0;
            for (const entry of list) {
                // Everything up to this override is the usual size.
                const before = entry.index - index;
                if (position < start + before * base) return Math.min(count - 1, index + Math.floor((position - start) / base));
                start += before * base;
                index = entry.index;
                if (position < start + entry.size) return index;
                start += entry.size;
                index += 1;
            }
            return Math.min(count - 1, index + Math.floor((position - start) / base));
        }
    };
}

export interface Metrics {
    columns: Axis;
    rows: Axis;
}

export function createMetrics(options: MetricsOptions): Metrics {
    const columnWidths = new Map<number, number>();
    for (const [label, width] of Object.entries(options.columnWidths ?? {})) columnWidths.set(columnIndex(label), width);
    const rowHeights = new Map<number, number>();
    for (const [row, height] of Object.entries(options.rowHeights ?? {})) rowHeights.set(Number(row) - 1, height);
    return {
        columns: createAxis(options.columns, options.columnWidth ?? 104, columnWidths),
        rows: createAxis(options.rows, options.rowHeight ?? 28, rowHeights)
    };
}

/** The rows and columns worth drawing: what is on screen, and a little either side. */
export interface Window {
    firstRow: number;
    lastRow: number;
    firstColumn: number;
    lastColumn: number;
}

export function visibleWindow(metrics: Metrics, scroll: { x: number; y: number }, size: { width: number; height: number }, overscan = 2): Window {
    const firstRow = Math.max(0, metrics.rows.at(scroll.y) - overscan);
    const lastRow = Math.min(metrics.rows.count - 1, metrics.rows.at(scroll.y + size.height) + overscan);
    const firstColumn = Math.max(0, metrics.columns.at(scroll.x) - overscan);
    const lastColumn = Math.min(metrics.columns.count - 1, metrics.columns.at(scroll.x + size.width) + overscan);
    return { firstRow, lastRow, firstColumn, lastColumn };
}

/** Where the keyboard is, and the rectangle it has been dragged over. */
export interface Selection {
    /** The cell a key types into: one corner of the range, not always the first. */
    active: CellAddress;
    /** Where the range started; the range runs from here to `active`. */
    anchor: CellAddress;
}

export const selectionRange = (selection: Selection): CellRange => normalizeRange({ from: selection.anchor, to: selection.active });
export const isSelected = (selection: Selection, address: CellAddress): boolean => rangeContains(selectionRange(selection), address);
export const singleCell = (selection: Selection): boolean => sameAddress(selection.active, selection.anchor);

const clamp = (value: number, max: number) => Math.max(0, Math.min(max, value));

/** The active cell moved, with the anchor brought along unless the move extends. */
export function moveSelection(selection: Selection, delta: { rows?: number; cols?: number }, bounds: { rows: number; columns: number }, extend = false): Selection {
    const active = {
        row: clamp(selection.active.row + (delta.rows ?? 0), bounds.rows - 1),
        col: clamp(selection.active.col + (delta.cols ?? 0), bounds.columns - 1)
    };
    return { active, anchor: extend ? selection.anchor : active };
}

export function selectTo(selection: Selection, address: CellAddress, bounds: { rows: number; columns: number }): Selection {
    return { anchor: selection.anchor, active: { row: clamp(address.row, bounds.rows - 1), col: clamp(address.col, bounds.columns - 1) } };
}

export function selectAt(address: CellAddress, bounds: { rows: number; columns: number }): Selection {
    const at = { row: clamp(address.row, bounds.rows - 1), col: clamp(address.col, bounds.columns - 1) };
    return { active: at, anchor: at };
}

/**
 * Where Ctrl and an arrow land: the far end of the run the caret is in, or
 * the next thing along where it is standing on nothing. It is how a person
 * gets to the bottom of a column of ten thousand rows.
 */
export function jumpTarget(address: CellAddress, delta: { rows?: number; cols?: number }, bounds: { rows: number; columns: number }, filled: (at: CellAddress) => boolean): CellAddress {
    const step = { row: delta.rows ?? 0, col: delta.cols ?? 0 };
    if (!step.row && !step.col) return address;
    const inside = (at: CellAddress) => at.row >= 0 && at.col >= 0 && at.row < bounds.rows && at.col < bounds.columns;
    const next = (at: CellAddress) => ({ row: at.row + step.row, col: at.col + step.col });

    let at = address;
    const first = next(at);
    if (!inside(first)) return at;
    if (!filled(at) || !filled(first)) {
        // Standing on nothing, or about to step into nothing: go to the next
        // thing there is, or the end of the sheet.
        at = first;
        while (inside(at) && !filled(at)) {
            const ahead = next(at);
            if (!inside(ahead)) return at;
            at = ahead;
        }
        return at;
    }
    // In a run: go to the last cell of it.
    while (inside(next(at)) && filled(next(at))) at = next(at);
    return at;
}

/**
 * Tab and Enter walk the selected rectangle rather than the sheet, so filling
 * a block in is a matter of typing: Tab at the end of a row drops to the next,
 * and Enter at the foot of a column moves to the top of the next one.
 */
export function walkSelection(selection: Selection, range: CellRange, along: 'row' | 'column', back: boolean): Selection {
    const box = normalizeRange(range);
    const width = box.to.col - box.from.col + 1;
    const height = box.to.row - box.from.row + 1;
    const at = selection.active;
    const index = along === 'row' ? (at.row - box.from.row) * width + (at.col - box.from.col) : (at.col - box.from.col) * height + (at.row - box.from.row);
    const count = width * height;
    const moved = (index + (back ? -1 : 1) + count) % count;
    const active =
        along === 'row'
            ? { row: box.from.row + Math.floor(moved / width), col: box.from.col + (moved % width) }
            : { row: box.from.row + (moved % height), col: box.from.col + Math.floor(moved / height) };
    return { active, anchor: selection.anchor };
}

/** How far the viewport has to move for a cell to be in it, in pixels. */
export function scrollIntoView(
    metrics: Metrics,
    address: CellAddress,
    scroll: { x: number; y: number },
    size: { width: number; height: number }
): { x: number; y: number } {
    const left = metrics.columns.offset(address.col);
    const right = left + metrics.columns.size(address.col);
    const top = metrics.rows.offset(address.row);
    const bottom = top + metrics.rows.size(address.row);
    return {
        x: left < scroll.x ? left : right > scroll.x + size.width ? right - size.width : scroll.x,
        y: top < scroll.y ? top : bottom > scroll.y + size.height ? bottom - size.height : scroll.y
    };
}
