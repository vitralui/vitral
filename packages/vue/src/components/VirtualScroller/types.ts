import type { BaseProps } from '../../base/types';

export interface VirtualScrollerProps extends BaseProps {
    /** Every item; only the ones near the viewport are rendered. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items?: any[];
    /** One item's height (or width, horizontally) in pixels. */
    itemSize: number;
    /** Scroll along `'vertical'` (the default) or `'horizontal'`. */
    orientation?: 'vertical' | 'horizontal';
    /** The container's height (or width), when its parent does not set one. */
    scrollHeight?: string;
    scrollWidth?: string;
    /** Items rendered past each edge of the viewport. Defaults to half a viewport. */
    numToleratedItems?: number;
    /** Ask for items as they come into view (`lazy-load`) instead of having them all. */
    lazy?: boolean;
    /** Show the loader over the list. */
    loading?: boolean;
    /** Render every item, as a plain container would. */
    disabled?: boolean;
    /** Milliseconds to wait after scrolling stops before `lazy-load`. Defaults to 0. */
    delay?: number;
    /** A key field for the rendered items; their index is used without one. */
    dataKey?: string;
}

export interface VirtualScrollerItemOptions {
    index: number;
    count: number;
    first: boolean;
    last: boolean;
    even: boolean;
    odd: boolean;
}

export type VirtualScrollerEmits = {
    'scroll-index-change': [event: { first: number; last: number }];
    /** In lazy mode, the range of items the scroller is about to show. */
    'lazy-load': [event: { first: number; last: number }];
    scroll: [event: Event];
};

export interface VirtualScrollerSlots {
    item?: (props: { item: unknown; options: VirtualScrollerItemOptions }) => unknown;
    /** Replaces the rendered range entirely, for a table body, say. `styleOffset` places it. */
    content?: (props: { items: unknown[]; first: number; last: number; styleOffset: Record<string, string>; itemSize: number }) => unknown;
    loader?: () => unknown;
}
