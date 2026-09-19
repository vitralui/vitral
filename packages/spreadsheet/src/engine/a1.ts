import type { CellAddress, CellRange, ParsedRef } from './types';

/**
 * Addresses, the way a person writes them. A1 is the language of a
 * spreadsheet: `B7`, `$B$7` for one that does not move when it is filled,
 * `A1:C9` for a rectangle. Inside, everything is a zero-based row and column,
 * which is how the grid indexes and how the dependency graph keys.
 */

/** `0` is A, `25` is Z, `26` is AA: base 26 with no zero digit. */
export function columnLabel(col: number): string {
    let label = '';
    for (let n = col; n >= 0; n = Math.floor(n / 26) - 1) label = String.fromCharCode(65 + (n % 26)) + label;
    return label;
}

export function columnIndex(label: string): number {
    let n = 0;
    for (const char of label.toUpperCase()) n = n * 26 + (char.charCodeAt(0) - 64);
    return n - 1;
}

/** The key a cell is held under: cheaper than an object, and it sorts. */
export const cellKey = (row: number, col: number): string => `${row}:${col}`;
export const keyOf = (address: CellAddress): string => cellKey(address.row, address.col);
export function fromKey(key: string): CellAddress {
    const [row, col] = key.split(':');
    return { row: Number(row), col: Number(col) };
}

const REFERENCE = /^(\$?)([A-Za-z]{1,3})(\$?)([0-9]{1,7})$/;

/** `$B$7` read as a place and what of it is pinned. */
export function parseRef(text: string): ParsedRef | null {
    const match = REFERENCE.exec(text.trim());
    if (!match) return null;
    const row = Number(match[4]) - 1;
    const col = columnIndex(match[2]!);
    if (row < 0 || col < 0) return null;
    return { row, col, colAbsolute: match[1] === '$', rowAbsolute: match[3] === '$' };
}

export function formatRef(ref: CellAddress | ParsedRef): string {
    const pinned = ref as ParsedRef;
    return `${pinned.colAbsolute ? '$' : ''}${columnLabel(ref.col)}${pinned.rowAbsolute ? '$' : ''}${ref.row + 1}`;
}

/** `A1:C9`, or a single cell, which is a rectangle one cell wide. */
export function parseRange(text: string): CellRange | null {
    const [left, right, extra] = text.split(':');
    if (extra !== undefined || !left) return null;
    const from = parseRef(left);
    if (!from) return null;
    if (right === undefined) return { from, to: from };
    const to = parseRef(right);
    return to ? { from, to } : null;
}

export const formatRange = (range: CellRange): string =>
    range.from.row === range.to.row && range.from.col === range.to.col ? formatRef(range.from) : `${formatRef(range.from)}:${formatRef(range.to)}`;

/** The same rectangle with its top-left corner first, whichever way it was dragged. */
export function normalizeRange(range: CellRange): CellRange {
    return {
        from: { row: Math.min(range.from.row, range.to.row), col: Math.min(range.from.col, range.to.col) },
        to: { row: Math.max(range.from.row, range.to.row), col: Math.max(range.from.col, range.to.col) }
    };
}

export const rangeRows = (range: CellRange): number => Math.abs(range.to.row - range.from.row) + 1;
export const rangeColumns = (range: CellRange): number => Math.abs(range.to.col - range.from.col) + 1;
export const rangeArea = (range: CellRange): number => rangeRows(range) * rangeColumns(range);

export function rangeContains(range: CellRange, address: CellAddress): boolean {
    const r = normalizeRange(range);
    return address.row >= r.from.row && address.row <= r.to.row && address.col >= r.from.col && address.col <= r.to.col;
}

/** Every cell of a rectangle, row by row: the order a range reads in. */
export function* rangeCells(range: CellRange): Generator<CellAddress> {
    const r = normalizeRange(range);
    for (let row = r.from.row; row <= r.to.row; row++) for (let col = r.from.col; col <= r.to.col; col++) yield { row, col };
}

export const sameAddress = (a: CellAddress, b: CellAddress): boolean => a.row === b.row && a.col === b.col;
export const singleRange = (address: CellAddress): CellRange => ({ from: address, to: address });

/**
 * A reference carried to another cell: what is pinned with `$` stays, the rest
 * moves by as much as the formula did. This is what makes a filled column of
 * `=B2*C2` work, and what a copy and paste does to the formula it carries.
 */
export function offsetRef(ref: ParsedRef, rows: number, cols: number): ParsedRef {
    return {
        row: ref.rowAbsolute ? ref.row : ref.row + rows,
        col: ref.colAbsolute ? ref.col : ref.col + cols,
        rowAbsolute: ref.rowAbsolute,
        colAbsolute: ref.colAbsolute
    };
}
