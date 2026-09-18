import type { BaseProps, Size } from '../../base/types';
import type { TreeNodeLike } from '../Tree/types';

export interface TreeTableProps extends BaseProps {
    /** The rows, as tree nodes whose `data` the columns read. */
    value?: TreeNodeLike[];
    selectionMode?: 'single' | 'multiple' | 'checkbox';
    /** Sort by this `data` field… */
    sortField?: string | null;
    /** …ascending (1) or descending (-1). */
    sortOrder?: 1 | -1 | null;
    /** A third press on a sorted column takes it out of the sort. */
    removableSort?: boolean;
    /** Keep the rows (and the branches leading to them) whose `globalFilterFields` contain this text. */
    globalFilter?: string;
    /** The `data` fields `globalFilter` searches. */
    globalFilterFields?: string[];
    /** Page the top-level rows. */
    paginator?: boolean;
    /** Top-level rows per page. Defaults to 10. */
    rows?: number;
    rowsPerPageOptions?: number[];
    loading?: boolean;
    emptyMessage?: string;
    stripedRows?: boolean;
    showGridlines?: boolean;
    size?: Size;
    /** A CSS height; the header stays in view. */
    scrollHeight?: string;
    tableStyle?: string | Record<string, string>;
    /** Names the table for assistive technology. Or name it with `aria-label`. */
    caption?: string;
}

export type TreeTableEmits = {
    'node-expand': [node: TreeNodeLike];
    'node-collapse': [node: TreeNodeLike];
    'node-select': [node: TreeNodeLike];
    'node-unselect': [node: TreeNodeLike];
    sort: [event: { sortField: string | null; sortOrder: 1 | -1 | null }];
    page: [event: { page: number; first: number; rows: number; pageCount: number }];
};

export interface TreeTableSlots {
    /** The `<Column>`s, the same component DataTable reads. `expander` marks the column with the toggle. */
    default?: () => unknown;
    header?: () => unknown;
    footer?: () => unknown;
    empty?: () => unknown;
    loadingicon?: () => unknown;
}
