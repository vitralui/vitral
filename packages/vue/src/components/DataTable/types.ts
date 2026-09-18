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
export type DataTableFilterMeta = Record<string, FilterConstraintLike | CompositeFilterLike>;

export interface LoadOptionsLike {
    first?: number;
    rows?: number;
    sort?: SortMetaLike[];
    filters?: DataTableFilterMeta;
    globalFilter?: { value: unknown; fields: string[]; matchMode?: string };
    locale?: string;
}

/** A core `DataSource` (from `createDataSource`). */
export interface DataSourceLike {
    readonly remote: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    load(options: LoadOptionsLike): Promise<{ items: any[]; total: number }>;
}

export interface DataTableProps extends BaseProps {
    /** The rows; with `lazy`, only the current page. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export interface DataTablePageEvent {
    page: number;
    first: number;
    rows: number;
    pageCount: number;
}

export interface DataTableSortEvent {
    originalEvent?: Event;
    sortField: string | null;
    sortOrder: 1 | -1 | null;
    multiSortMeta: SortMetaLike[];
}

export interface DataTableFilterEvent {
    filters: DataTableFilterMeta;
    filteredValue: unknown[];
}

export interface DataTableRowClickEvent {
    originalEvent: Event;
    data: unknown;
    index: number;
}

export interface DataTableRowSelectEvent {
    originalEvent?: Event;
    data: unknown;
    index: number;
    type: 'row' | 'checkbox' | 'radio';
}

export interface DataTableSelectAllEvent {
    originalEvent?: Event;
    data: unknown[];
}

export type DataTableEmits = {
    page: [event: DataTablePageEvent];
    sort: [event: DataTableSortEvent];
    filter: [event: DataTableFilterEvent];
    'lazy-load': [event: LoadOptionsLike];
    'row-click': [event: DataTableRowClickEvent];
    'row-select': [event: DataTableRowSelectEvent];
    'row-unselect': [event: DataTableRowSelectEvent];
    'row-select-all': [event: DataTableSelectAllEvent];
    'row-unselect-all': [event: DataTableSelectAllEvent];
};

export interface DataTableSlots {
    /** The `<Column>`s. */
    default?: () => unknown;
    header?: () => unknown;
    footer?: () => unknown;
    empty?: () => unknown;
    loadingicon?: () => unknown;
    paginatorstart?: (props: DataTablePageEvent) => unknown;
    paginatorend?: (props: DataTablePageEvent) => unknown;
}

export interface ColumnProps {
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
