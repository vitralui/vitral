import type { BaseProps } from '../../base/types';

export interface DataViewProps extends BaseProps {
    /** The items; with `lazy`, only the current page. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value?: any[];
    /** Which template renders the items: `list` (the default) or `grid`. */
    layout?: 'list' | 'grid';
    /** A field that identifies an item. */
    dataKey?: string;
    /** Sort by this field… */
    sortField?: string;
    /** …ascending (1) or descending (-1). */
    sortOrder?: 1 | -1 | 0;
    paginator?: boolean;
    /** Items per page. Defaults to 12. */
    rows?: number;
    rowsPerPageOptions?: number[];
    pageLinkSize?: number;
    paginatorPosition?: 'top' | 'bottom' | 'both';
    alwaysShowPaginator?: boolean;
    /** Nothing is computed here: page changes are emitted (`page`) for the app to answer. */
    lazy?: boolean;
    /** The total across pages when `lazy`. */
    totalRecords?: number;
    loading?: boolean;
    emptyMessage?: string;
}

export type DataViewEmits = {
    page: [event: { page: number; first: number; rows: number; pageCount: number }];
};

export interface DataViewSlots {
    header?: () => unknown;
    footer?: () => unknown;
    /** The items of the page, in the list layout. */
    list?: (props: { items: unknown[]; first: number }) => unknown;
    /** The items of the page, in the grid layout. The slot's elements are the grid's cells. */
    grid?: (props: { items: unknown[]; first: number }) => unknown;
    empty?: () => unknown;
    loadingicon?: () => unknown;
}
