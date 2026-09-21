import type { BaseProps, Size } from '../../base/types';

// The data-layer shapes from @vitral/core, restated for the SFC compiler.

export interface SortMetaLike {
    field: string;
    order: 1 | -1;
}

export interface FilterConstraintLike {
    value: unknown;
    matchMode?: string;
}

export interface CompositeFilterLike {
    operator: 'and' | 'or';
    constraints: FilterConstraintLike[];
}

/** Per-field filters keyed by field, plus an optional `global` one searched across `globalFilterFields`. */
export type DataGridFilterMeta = Record<string, FilterConstraintLike | CompositeFilterLike>;

export interface LoadOptionsLike {
    first?: number;
    rows?: number;
    sort?: SortMetaLike[];
    filters?: DataGridFilterMeta;
    globalFilter?: { value: unknown; fields: string[]; matchMode?: string };
    locale?: string;
}

/** A core `DataSource` (from `createDataSource`). */
export interface DataSourceLike {
    readonly remote: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    load(options: LoadOptionsLike): Promise<{ items: any[]; total: number }>;
}

/** A table's column layout: the order, the widths, what is hidden and what is pinned. */
export interface ColumnLayoutLike {
    order?: string[];
    widths?: Record<string, number>;
    hidden?: string[];
    pinned?: Record<string, 'left' | 'right'>;
}

export interface DataGridProps extends BaseProps {
    /** The rows; with `lazy`, only the current page. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    /**
     * Gathers the rows by this field and puts a heading over each run, with a
     * count and a toggle. Grouping happens after the query, so sorting and
     * filtering still decide which rows there are; `v-model:collapsedGroups`
     * holds which of them the reader has shut.
     */
    groupBy?: string;
    /** What a group's heading says; the value itself by default. */
    groupLabel?: (context: { value: unknown; count: number; rows: any[] }) => string;
    value?: any[];
    /** A field that identifies a row, for selection and row keys. */
    dataKey?: string;
    /** Rows come from a data source, local or remote, instead of `value`. */
    dataSource?: DataSourceLike;
    /** Nothing is computed here: sort, filter and page changes are emitted (`lazy-load`) for the app to answer. */
    lazy?: boolean;
    /** The total across pages when `lazy`. */
    totalRecords?: number;
    loading?: boolean;

    paginator?: boolean;
    rowsPerPageOptions?: number[];
    pageLinkSize?: number;
    paginatorTemplate?: string | ('FirstPageLink' | 'PrevPageLink' | 'PageLinks' | 'NextPageLink' | 'LastPageLink' | 'RowsPerPageDropdown' | 'CurrentPageReport')[];
    currentPageReportTemplate?: string;
    paginatorPosition?: 'top' | 'bottom';
    alwaysShowPaginator?: boolean;

    sortMode?: 'single' | 'multiple';
    /** A third click on a sorted column takes it out of the sort. */
    removableSort?: boolean;

    globalFilterFields?: string[];
    /** `'row'` puts a filter box under each filterable column's header. */
    filterDisplay?: 'row';
    /** Milliseconds to wait after typing before a lazy table or a data source is asked again. */
    filterDelay?: number;

    selectionMode?: 'single' | 'multiple';

    /** A handle on every column's trailing edge, dragged (or keyed) to set its width. */
    resizableColumns?: boolean;
    /** `'fit'` takes the width from the next column, keeping the table's own; `'expand'` widens the table. */
    columnResizeMode?: 'fit' | 'expand';
    /** Columns can be dragged by their header into another order, or moved with Ctrl and an arrow key. */
    reorderableColumns?: boolean;
    /** A button that opens the list of columns, each with a checkbox. */
    columnToggle?: boolean;
    /** A name two tables share: they scroll sideways together and keep one column layout. */
    group?: string;

    stripedRows?: boolean;
    showGridlines?: boolean;
    size?: Size;
    scrollable?: boolean;
    /** A CSS height, or `'flex'` to fill a flex parent. The header stays in view. */
    scrollHeight?: string;
    emptyMessage?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rowClass?: (data: any) => unknown;
    tableStyle?: string | Record<string, string>;
    /** Names the table. Hidden unless `showCaption`; without it, name the table with `aria-label`. */
    caption?: string;
    showCaption?: boolean;
}

export interface DataGridPageEvent {
    page: number;
    first: number;
    rows: number;
    pageCount: number;
}

export interface DataGridSortEvent {
    originalEvent?: Event;
    sortField: string | null;
    sortOrder: 1 | -1 | null;
    multiSortMeta: SortMetaLike[];
}

export interface DataGridFilterEvent {
    filters: DataGridFilterMeta;
    filteredValue: unknown[];
}

export interface DataGridRowClickEvent {
    originalEvent: Event;
    data: unknown;
    index: number;
}

export interface DataGridRowSelectEvent {
    originalEvent?: Event;
    data: unknown;
    index: number;
    type: 'row' | 'checkbox' | 'radio';
}

export interface DataGridSelectAllEvent {
    originalEvent?: Event;
    data: unknown[];
}

export interface DataGridColumnEvent {
    originalEvent?: Event;
    /** The column, by `columnKey` or `field`. */
    key: string;
    layout: ColumnLayoutLike;
}

export type DataGridEmits = {
    page: [event: DataGridPageEvent];
    /** A column was widened or narrowed. */
    'column-resize': [event: DataGridColumnEvent & { width: number }];
    /** A column was moved. */
    'column-reorder': [event: DataGridColumnEvent & { order: string[] }];
    /** A column was shown or hidden. */
    'column-toggle': [event: DataGridColumnEvent & { visible: boolean }];
    /** A column was stuck to an edge, or let go. */
    'column-pin': [event: DataGridColumnEvent & { side: 'left' | 'right' | null }];
    sort: [event: DataGridSortEvent];
    filter: [event: DataGridFilterEvent];
    'lazy-load': [event: LoadOptionsLike];
    'row-click': [event: DataGridRowClickEvent];
    'row-select': [event: DataGridRowSelectEvent];
    'row-unselect': [event: DataGridRowSelectEvent];
    'row-select-all': [event: DataGridSelectAllEvent];
    'row-unselect-all': [event: DataGridSelectAllEvent];
};

export interface DataGridSlots {
    /** The `<Column>`s. */
    default?: () => unknown;
    header?: () => unknown;
    footer?: () => unknown;
    empty?: () => unknown;
    loadingicon?: () => unknown;
    paginatorstart?: (props: DataGridPageEvent) => unknown;
    paginatorend?: (props: DataGridPageEvent) => unknown;
}

export interface ColumnProps {
    /** This column can be resized; every column can when the table says so. Set `false` to pin its width. */
    resizable?: boolean;
    /** The smallest this column may be dragged to, in pixels. */
    minWidth?: number;
    /** Its width to start from, in pixels, before the reader changes it. */
    width?: number;
    /** Stick this column to an edge while the rest scrolls. */
    pinned?: 'left' | 'right';
    /** Offer this column in the column list. Defaults to true; a selection column is never offered. */
    toggleable?: boolean;
    /** Identifies the column when `field` does not (two columns on one field, or none). */
    columnKey?: string;
    /** The field (dotted path) a cell shows, sorts and filters by. */
    field?: string;
    /** Sort by this field instead of `field`. */
    sortField?: string;
    /** Filter by this field instead of `field`. */
    filterField?: string;
    header?: string;
    footer?: string;
    sortable?: boolean;
    /** A column of selection controls: checkboxes with a select-all (`multiple`) or radios (`single`). */
    selectionMode?: 'single' | 'multiple';
    align?: 'left' | 'center' | 'right';
    filterPlaceholder?: string;
    /** The match mode a new filter value on this column uses when `filters` does not say. */
    filterMatchMode?: string;
    hidden?: boolean;
    /** In a TreeTable, the column that holds the expand toggle and the indentation. The first column by default. */
    expander?: boolean;
    headerClass?: unknown;
    headerStyle?: unknown;
    bodyClass?: unknown;
    bodyStyle?: unknown;
}

export interface ColumnSlots {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body?: (props: { data: any; field?: string; index: number; column: Record<string, unknown> }) => unknown;
    header?: (props: { column: Record<string, unknown> }) => unknown;
    footer?: (props: { column: Record<string, unknown> }) => unknown;
    /** A custom filter control. Set `filterModel.value` (then call `filterCallback()` if the object is not reactive). */
    filter?: (props: { field: string; filterModel: FilterConstraintLike | CompositeFilterLike | undefined; filterCallback: () => void }) => unknown;
}
