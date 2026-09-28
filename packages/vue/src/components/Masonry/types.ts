import type { BaseProps } from '../../base/types';

export interface MasonryProps extends BaseProps {
    /** A fixed number of columns; otherwise as many as fit `minColumnWidth`. */
    columns?: number;
    /** Any CSS length; the theme's (`15rem`) otherwise. */
    minColumnWidth?: string;
    /** Any CSS length; the theme's (`1rem`) otherwise. */
    gap?: string;
}

export interface MasonrySlots {
    /** The items, one element each, in reading order. */
    default?: () => unknown;
}
