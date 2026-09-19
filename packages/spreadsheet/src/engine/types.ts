import type { ClassEntry, Locale } from '@vitral/core';
import type { PassThrough } from '@vitral/dom';

/**
 * What a sheet is made of, as plain data. Everything here survives `JSON`:
 * a sheet is a map of A1 addresses to what was typed into them, and nothing
 * else has to be kept for it to come back the same.
 */

/** Where a cell is: zero-based, row then column, which is how the grid indexes. */
export interface CellAddress {
    row: number;
    col: number;
}

/** A rectangle, in whichever corner order it was dragged; `normalizeRange` sorts it. */
export interface CellRange {
    from: CellAddress;
    to: CellAddress;
}

/** A reference as it was written: a place, and what of it a `$` pinned. */
export interface ParsedRef extends CellAddress {
    rowAbsolute: boolean;
    colAbsolute: boolean;
}

/** What a formula can go wrong with. An error is a value: it travels. */
export const cellErrors = ['#DIV/0!', '#VALUE!', '#REF!', '#NAME?', '#N/A', '#CIRCULAR!', '#ERROR!'] as const;
export type CellErrorCode = (typeof cellErrors)[number];

export interface CellError {
    error: CellErrorCode;
}

/** What a cell works out to. A date is a number with a format over it. */
export type Scalar = string | number | boolean | null | CellError;

/** A rectangle of values, read row by row, with its shape kept: `INDEX` and `VLOOKUP` need it. */
export interface RangeValue {
    rows: number;
    cols: number;
    values: Scalar[];
}

/** What an argument is given as: one value, or a rectangle. */
export type Argument = Scalar | RangeValue;

export const isError = (value: unknown): value is CellError => typeof value === 'object' && value !== null && typeof (value as CellError).error === 'string';
export const isRangeValue = (value: unknown): value is RangeValue => typeof value === 'object' && value !== null && Array.isArray((value as RangeValue).values);
export const errorValue = (code: CellErrorCode): CellError => ({ error: code });

/** How a value is written out. The engine stores it; the renderer asks for the text. */
export interface CellFormat {
    kind?: 'general' | 'number' | 'percent' | 'currency' | 'date' | 'text';
    /** Digits after the point, where the kind has any. */
    decimals?: number;
    /** An ISO currency code, for `currency`. */
    currency?: string;
    align?: 'left' | 'center' | 'right';
    bold?: boolean;
    italic?: boolean;
}

/** A cell as it is held: what was typed, and what that came to. */
export interface Cell {
    /** What the person typed. A formula starts with `=`. */
    input: string;
    format?: CellFormat;
}

/** One edit, as the undo history keeps it. */
export interface CellPatch {
    key: string;
    before: Cell | undefined;
    after: Cell | undefined;
}

export interface SheetOptions {
    /** The cells, keyed by A1: `{ A1: 'Sales', B2: 42, B3: '=B2*2' }`. */
    cells?: Record<string, string | number | boolean | null>;
    /** How many rows and columns the grid offers. */
    rows?: number;
    columns?: number;
    /** Formats, keyed by A1 or by a range: `{ 'B2:B9': { kind: 'currency' } }`. */
    formats?: Record<string, CellFormat>;
    /** Where `TODAY()` and `NOW()` read the clock; a spec pins it. */
    now?: () => Date;
    locale?: Locale;
}

/** What a sheet tells the outside when something in it moved. */
export interface SheetEvents {
    /** Cells changed: which ones, and whether it was an undo. */
    change?: (event: { keys: string[]; source: 'edit' | 'undo' | 'redo' }) => void;
}

/** What the renderer is told, over and above the sheet itself. */
export interface SpreadsheetConfig extends SheetOptions {
    /** Column widths in pixels, by column letter: `{ A: 180 }`. */
    columnWidths?: Record<string, number>;
    /** Row heights in pixels, by row number (1-based, as a person counts). */
    rowHeights?: Record<number, number>;
    /** Rows and columns held still while the rest scrolls. */
    frozen?: { rows?: number; columns?: number };
    /** The bar over the grid that shows the address and the formula. */
    formulaBar?: boolean;
    /** Nothing can be typed into it. */
    readonly?: boolean;
    unstyled?: boolean;
    classes?: Partial<Record<string, ClassEntry>>;
    pt?: PassThrough;
    id?: string;
    nonce?: string;
    cssLayer?: string | false;
    ariaLabel?: string;
}
