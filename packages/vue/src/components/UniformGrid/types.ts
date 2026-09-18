import type { Component } from 'vue';
import type { BaseProps } from '../../base/types';

export interface UniformGridProps extends BaseProps {
    /** Number of rows. Left out, it is however many the children need. */
    rows?: number;
    /** Number of columns. Left out, it is however many the children need; with rows left out too, the grid is square. */
    columns?: number;
    /** Empty cells before the first child. Applies when `columns` is set and it is smaller than it. */
    firstColumn?: number;
    /** Space between cells. Defaults to the `uniformgrid.spacing` token. */
    spacing?: number | string;
    as?: string | Component;
}

export interface UniformGridSlots {
    default?: () => unknown;
}
