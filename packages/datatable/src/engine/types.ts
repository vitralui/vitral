import type { ClassEntry, ColumnLayout, DataSource, FilterMeta, Locale, SortMeta } from '@vitral/core';
import type { PassThrough } from '@vitral/dom';

/**
 * What a table is told, as plain data. Everything here survives `JSON` except
 * the functions a host hands in for a cell it wants to draw itself, which is
 * what a framework component uses to pass a slot through.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = any;

/** What a cell is given: the row, where it is, and the column it belongs to. */
export interface CellContext<T = Row> {
    row: T;
    /** Its index on the page. */
    index: number;
    field?: string;
    value: unknown;
    column: TableColumn<T>;
}

/** Content a host draws itself: a string, a node it made, or nothing. */
export type Content = string | number | Node | null | undefined;

export type PaginatorItem = 'FirstPageLink' | 'PrevPageLink' | 'PageLinks' | 'NextPageLink' | 'LastPageLink' | 'RowsPerPageDropdown' | 'CurrentPageReport';

export interface TableColumn<T = Row> {
    /** Identifies the column when `field` does not (two columns on one field, or none). */
    key?: string;
    /** The field (dotted path) a cell shows, sorts and filters by. */
    field?: string;
    header?: string;
    footer?: string;
    sortable?: boolean;
    sortField?: string;
    filterField?: string;
    filterPlaceholder?: string;
    filterMatchMode?: string;
    /** A column of selection controls: checkboxes with a select-all (`multiple`) or radios (`single`). */
    selectionMode?: 'single' | 'multiple';
    align?: 'left' | 'center' | 'right';
    hidden?: boolean;
    /** This column can be resized; every column can when the table says so. */
    resizable?: boolean;
    minWidth?: number;
    width?: number;
    pinned?: 'left' | 'right';
    /** Offer this column in the column list. A selection column never is. */
    toggleable?: boolean;
    headerClass?: string;
    bodyClass?: string;
    headerStyle?: Record<string, string>;
    bodyStyle?: Record<string, string>;
    /** Draws the cell. Without it, the field's value is shown as text. */
    body?: (context: CellContext<T>) => Content;
    /** Draws the header, beside or instead of `header`. */
    headerContent?: (context: { column: TableColumn<T> }) => Content;
    footerContent?: (context: { column: TableColumn<T> }) => Content;
    /** Draws the filter control for this column, instead of the text box. */
    filterContent?: (context: { column: TableColumn<T>; value: unknown; setValue: (value: unknown) => void }) => Content;
}

/** Where the table is in its pages, for whatever a host draws around it. */
export interface PageContext {
    first: number;
    rows: number;
    page: number;
    pageCount: number;
    total: number;
}

/** The page size control's own context: the sizes offered, and how to choose one. */
export interface RowsPerPageContext extends PageContext {
    options: readonly number[];
    setRows: (rows: number) => void;
}

/**
 * The parts a host draws itself, beside the ones a column draws. A framework
 * component passes its slots through here; a page with no framework hands in
 * nodes it made, or nothing, and the table draws its own.
 */
export interface TableContent {
    /** The bar above the table, beside the column list. */
    header?: () => Content;
    /** The bar below it. */
    footer?: () => Content;
    /** What an empty table says, instead of the message. */
    empty?: () => Content;
    loadingIcon?: () => Content;
    /** Drawn instead of the built-in paginator, where that one would be. */
    paginator?: (context: PageContext) => Content;
    paginatorStart?: (context: PageContext) => Content;
    paginatorEnd?: (context: PageContext) => Content;
    /**
     * The page size control, instead of the native `<select>` the paginator
     * draws. A framework component puts its own select here; a page with no
     * framework gets the reader's own, which on a phone is the picker they
     * already know.
     */
    rowsPerPage?: (context: RowsPerPageContext) => Content;
}

export interface TableEvents<T = Row> {
    page?: (event: { first: number; rows: number; page: number; pageCount: number }) => void;
    sort?: (event: { originalEvent?: Event; sortField: string | null; sortOrder: 1 | -1 | null; multiSortMeta: SortMeta[] }) => void;
    filter?: (event: { filters: FilterMeta; filteredValue: T[] }) => void;
    'row-click'?: (event: { originalEvent: Event; data: T; index: number }) => void;
    'row-select'?: (event: { originalEvent?: Event; data: T; index: number; type: 'row' | 'checkbox' | 'radio' }) => void;
    'row-unselect'?: (event: { originalEvent?: Event; data: T; index: number; type: 'row' | 'checkbox' | 'radio' }) => void;
    'row-select-all'?: (event: { originalEvent?: Event; data: T[] }) => void;
    'row-unselect-all'?: (event: { originalEvent?: Event; data: T[] }) => void;
    'lazy-load'?: (options: LoadRequest) => void;
    'column-resize'?: (event: ColumnEvent & { width: number }) => void;
    'column-reorder'?: (event: ColumnEvent & { order: string[] }) => void;
    'column-toggle'?: (event: ColumnEvent & { visible: boolean }) => void;
    'column-pin'?: (event: ColumnEvent & { side: 'left' | 'right' | null }) => void;
    /** Anything the reader changed: the models a framework binds back. */
    change?: (state: TableModels) => void;
}

export interface ColumnEvent {
    originalEvent?: Event;
    key: string;
    layout: ColumnLayout;
}

/** What the table asks a server, or a data source, for. */
export interface LoadRequest {
    first?: number;
    rows?: number;
    sort?: SortMeta[];
    filters?: FilterMeta;
    globalFilter?: { value: unknown; fields: string[]; matchMode?: string };
    locale?: string;
}

/** The parts of the state a host binds: everything the reader can change. */
export interface TableModels {
    first: number;
    rows: number;
    sortField: string | null;
    sortOrder: 1 | -1 | null;
    multiSortMeta: SortMeta[];
    filters: FilterMeta;
    selection: unknown;
    columnLayout: ColumnLayout;
}

export interface TableConfig<T = Row> extends Partial<TableModels> {
    /** The rows; with `lazy`, only the current page. */
    value?: T[];
    columns?: TableColumn<T>[];
    /** A field that identifies a row, for selection and row keys. */
    dataKey?: string;
    /** Rows come from a data source, local or remote, instead of `value`. */
    dataSource?: DataSource<T>;
    /** Nothing is computed here: the changes are reported for the host to answer. */
    lazy?: boolean;
    totalRecords?: number;
    loading?: boolean;

    paginator?: boolean;
    rowsPerPageOptions?: number[];
    pageLinkSize?: number;
    /** Which controls the paginator holds, and in what order. */
    paginatorTemplate?: string | PaginatorItem[];
    /** The page report's wording, with `{first}`, `{last}`, `{totalRecords}`, `{page}` and `{pageCount}`. */
    currentPageReportTemplate?: string;
    paginatorPosition?: 'top' | 'bottom';
    alwaysShowPaginator?: boolean;

    sortMode?: 'single' | 'multiple';
    removableSort?: boolean;

    globalFilterFields?: string[];
    /** `'row'` puts a filter box under each filterable column's header. */
    filterDisplay?: 'row';
    filterDelay?: number;

    selectionMode?: 'single' | 'multiple';

    resizableColumns?: boolean;
    columnResizeMode?: 'fit' | 'expand';
    reorderableColumns?: boolean;
    columnToggle?: boolean;
    /** A name two tables share: they scroll sideways together and keep one column layout. */
    group?: string;

    stripedRows?: boolean;
    showGridlines?: boolean;
    size?: 'small' | 'large';
    scrollable?: boolean;
    scrollHeight?: string;
    emptyMessage?: string;
    rowClass?: (row: T) => string | undefined;
    tableStyle?: string | Record<string, string>;
    caption?: string;
    showCaption?: boolean;

    /** Names the table for assistive technology, when there is no caption. */
    ariaLabel?: string;
    ariaLabelledby?: string;

    locale?: Locale;
    /** Drop the built-in classes and stylesheet; style through `pt` or `classes` instead. */
    unstyled?: boolean;
    classes?: Partial<Record<string, ClassEntry>>;
    pt?: PassThrough;
    /** Prefix of the ids the table gives its elements; generated when unset. */
    id?: string;
    /** What the host draws itself. */
    content?: TableContent;
    /** For a Content-Security-Policy: the nonce of the injected stylesheet. */
    nonce?: string;
    /** A CSS cascade layer to put the stylesheet in. */
    cssLayer?: string | false;
    /**
     * Where overlays are put: an element, a selector, or a function giving
     * either. `'body'` and `'self'` mean the nearest overlay scope, and the
     * document's body when there is none.
     */
    overlayTarget?: HTMLElement | string | (() => HTMLElement | string | null | undefined);
    /** The z-index overlays start from. */
    zIndex?: number;
    on?: TableEvents<T>;
}
