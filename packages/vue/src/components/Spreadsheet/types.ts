import type { BaseProps } from '../../base/types';

// Prop types stay local rather than imported from `@vitral/spreadsheet`: the
// SFC compiler reads them to generate the runtime prop definitions, and it
// resolves a relative file where it may not resolve a package alias.

/** Where a cell is: zero-based, row then column. */
export interface CellAddressLike {
    row: number;
    col: number;
}

export interface CellRangeLike {
    from: CellAddressLike;
    to: CellAddressLike;
}

/** How a value is written out. */
export interface CellFormatLike {
    kind?: 'general' | 'number' | 'percent' | 'currency' | 'date' | 'text';
    /** Digits after the point, where the kind has any. */
    decimals?: number;
    /** An ISO currency code, for `currency`. */
    currency?: string;
    align?: 'left' | 'center' | 'right';
    bold?: boolean;
    italic?: boolean;
}

/** What a toolbar can hold, by name. */
export type SpreadsheetToolbarItemLike =
    | 'undo'
    | 'redo'
    | 'numberFormat'
    | 'currency'
    | 'percent'
    | 'decimalDecrease'
    | 'decimalIncrease'
    | 'bold'
    | 'italic'
    | 'alignLeft'
    | 'alignCenter'
    | 'alignRight'
    | 'clear';

export interface SpreadsheetProps extends BaseProps {
    /**
     * The cells, keyed by A1: `{ A1: 'Sales', B2: 42, B3: '=B2*2' }`. What is
     * kept is what was typed, so a formula survives a round trip.
     */
    modelValue?: Record<string, string | number | boolean | null>;
    /** How many rows and columns the grid offers. */
    rows?: number;
    columns?: number;
    /** Formats, by A1 or by a rectangle: `{ 'B2:B9': { kind: 'currency' } }`. */
    formats?: Record<string, CellFormatLike>;
    /** Widths in pixels by column letter; the reader's own resizing goes here too. */
    columnWidths?: Record<string, number>;
    /** Heights in pixels by row number, as a person counts them. */
    rowHeights?: Record<number, number>;
    /**
     * The bar of tools over the grid: `false` for none, or groups of item
     * names. The `toolbar` slot replaces the bar with parts of your own.
     */
    toolbar?: boolean | SpreadsheetToolbarItemLike[][];
    /** The bar over the grid that shows the address and the formula. On by default. */
    formulaBar?: boolean;
    /** The currency a cell formatted as money is written in. Defaults to the locale's. */
    currency?: string;
    /** Nothing can be typed into it. */
    readonly?: boolean;
    /** Names the grid, where no label points at it. */
    ariaLabel?: string;
}

export interface SpreadsheetSlots {
    /** Replaces the bar of tools over the grid. */
    toolbar?: () => unknown;
}

export interface SpreadsheetEmits {
    /** The cells, after an edit: what was typed, keyed by A1. */
    'update:modelValue': [value: Record<string, string>];
    /** Which cells changed, and whether it was an undo. */
    change: [event: { keys: string[]; source: 'edit' | 'undo' | 'redo'; cells: Record<string, string> }];
    /** The keyboard moved, or a rectangle was dragged out. */
    'selection-change': [event: { active: CellAddressLike; range: CellRangeLike; address: string }];
    'column-resize': [event: { column: number; width: number }];
    'row-resize': [event: { row: number; height: number }];
}
