import type { Component } from 'vue';
import type { BaseProps } from '../../base/types';

// Definitions use star sizing — `'Auto,*,2*,120'` — or one entry per
// track. `Auto` is `auto`, `*` is `1fr`, `2*` is `2fr`, a number is pixels, and
// anything else (`20%`, `minmax(8rem, 1fr)`) is taken as CSS.

export interface GridProps extends BaseProps {
    /** The row tracks. Left out, the grid has one row that fills it. */
    rows?: string | (string | number)[];
    /** The column tracks. Left out, the grid has one column that fills it. */
    columns?: string | (string | number)[];
    /** Space between rows. Defaults to the `grid.rowSpacing` token. */
    rowSpacing?: number | string;
    /** Space between columns. Defaults to the `grid.columnSpacing` token. */
    columnSpacing?: number | string;
    /** Outlines the grid and every cell — the debugging aid. */
    showGridLines?: boolean;
    as?: string | Component;
}

export interface GridSlots {
    default?: () => unknown;
}

export interface GridItemProps extends BaseProps {
    /** 0-based, as `Grid.Row` is. */
    row?: number | string;
    /** 0-based, as `Grid.Column` is. */
    column?: number | string;
    rowSpan?: number | string;
    columnSpan?: number | string;
    as?: string | Component;
}

export interface GridItemSlots {
    default?: () => unknown;
}
