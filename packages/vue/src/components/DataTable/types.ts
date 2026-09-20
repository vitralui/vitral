import type { SortMeta, SortOrder } from '@vitral/core';
import type { VNode } from 'vue';
import type { BaseProps } from '../../base/types';

export interface DataTableProps extends BaseProps {
    /** The rows, already in hand. This table does not fetch, page or filter. */
    value?: readonly unknown[];
    /** The field that identifies a row, used as its key. Falls back to its position. */
    dataKey?: string;
    /** Shown above the head, for a screen reader; use the `header` slot for something visible. */
    caption?: string;
    /** Every other row tinted. */
    stripedRows?: boolean;
    /** A line between columns as well as between rows. */
    showGridlines?: boolean;
    /** Rows light up under the pointer. Worth it when a row is a link or opens something. */
    rowHover?: boolean;
    size?: 'small' | 'large';
    /** Gives the table its own scroller of this height, and sticks the head to the top of it. */
    scrollHeight?: string;
    /** What to say when there are no rows; the `empty` slot wins over it. */
    emptyMessage?: string;
}

export interface DataTableEmits {
    /** The sort changed, by a header being activated. */
    sort: [event: { sortField: string | null; sortOrder: SortOrder | null; multiSortMeta: SortMeta[] }];
    rowClick: [event: { originalEvent: MouseEvent; data: unknown; index: number }];
}

export interface DataTableSlots {
    /** The `<Column>`s. Any other content here is ignored. */
    default?: () => VNode[];
    header?: () => VNode[];
    footer?: () => VNode[];
    empty?: () => VNode[];
}

export interface DataTableColumnProps {
    /** The row's field this column shows, `a.b.c` for a nested one. */
    field?: string;
    header?: string;
    /** Keeps the column's identity when there is no field. */
    columnKey?: string;
    sortable?: boolean;
    align?: 'left' | 'center' | 'right';
    /** Left off entirely, head and body. */
    hidden?: boolean;
    /** Put straight on the `<col>`, so a column can be given a width. */
    style?: unknown;
    class?: unknown;
}

export interface DataTableColumnSlots {
    body?: (props: { data: unknown; index: number; field?: string; column: Record<string, unknown> }) => VNode[];
    header?: (props: { column: Record<string, unknown> }) => VNode[];
}
