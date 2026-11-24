import type { BaseProps, Size, ScrollbarProps } from '../../base/types';

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

export interface DataGridProps extends BaseProps, ScrollbarProps {
    /** The rows; with `lazy`, only the current page. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    /**
     * Gathers the rows by this field and puts a heading over each run, with a
     * count and a toggle. Grouping happens after the query, so sorting and
     * filtering still decide which rows there are; `v-model:collapsedGroups`
     * holds which of them the reader has shut. A list groups by each field in turn: groups inside groups.
     */
    groupBy?: string | string[];
    /** What a group's heading says; the value itself by default. */
    groupLabel?: (context: { value: unknown; count: number; rows: any[]; field: string; level: number }) => string;
    /**
     * The rows hold rows of their own, found in this field or by this function: a tree, each row's rows under it
     * with a toggle to show them. `v-model:expandedTree` holds the keys of the open rows.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    treeData?: string | ((row: any) => any[] | null | undefined);
    /**
     * A bar under the grid that counts the rows: how many, how many the filters let through, how many are
     * selected. The function, or the `#status` slot, draws the bar's content from those counts instead.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    statusBar?: boolean | ((context: DataGridStatusContext) => any);
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
    /**
     * How the table waits. `'mask'` covers it with a spinner and keeps the rows it had;
     * `'skeleton'` draws placeholder rows in its own cells instead — same padding, size,
     * alignment and pinned columns — so it has the shape it will have when the rows arrive.
     * A `<Column>` draws its own placeholder with the `#skeleton` slot.
     */
    loadingMode?: 'mask' | 'skeleton';
    /**
     * How many placeholder rows a skeleton draws. By default, as many as the page holds now,
     * so a table fetching again keeps its height; with none, a page's worth when paginated,
     * and 5 when not.
     */
    skeletonRows?: number;

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
    /**
     * `'row'` puts a filter box under each filterable column's header; `'menu'` a button in the header of each
     * column with `filter`, which opens its filter panel; `'both'`, both.
     */
    filterDisplay?: 'row' | 'menu' | 'both';
    /** Milliseconds to wait after typing before a lazy table or a data source is asked again. */
    filterDelay?: number;

    selectionMode?: 'single' | 'multiple';

    /**
     * What the keyboard moves through: rows, or cells, which the arrows, Home, End and the page keys move
     * between, as in a spreadsheet. A grid with an editable column moves through cells unless told otherwise.
     */
    navigation?: 'row' | 'cell';
    /** `'cell'` (the default) edits a cell at a time; `'row'` opens every editable cell of a row, saved or dropped together. */
    editMode?: 'cell' | 'row';
    /** A single click opens a cell's editor, rather than a double click. */
    editOnClick?: boolean;
    /** Ctrl+Z and Ctrl+Y (⌘ on a Mac) undo and redo the reader's edits. On by default; `false` turns them off. */
    undoRedo?: boolean;
    /**
     * Cells can be marked as a block: dragged over, or reached with Shift and the arrows, Ctrl+A for all.
     * Ctrl+C copies the block as a spreadsheet does, Delete empties what can be edited in it, and the status bar
     * adds up its numbers.
     */
    cellSelection?: boolean;
    /** A handle at the marked block's corner: dragged down or across, it carries the block's values on. */
    fillHandle?: boolean;
    /** Ctrl+V pastes text from a spreadsheet into the cells that can be edited. On by default; `false` turns it off. */
    clipboard?: boolean;
    /** A cell whose value changes flashes, up or down for a number. A number is how long, in milliseconds. */
    flashCells?: boolean | number;
    /**
     * Turns the rows about: the values of the `rows` fields down the side, the values of the `columns` fields
     * across the top, and in each cell the `values` worked out over the rows that meet there (`aggregate`, a sum
     * by default). The pivot is sorted, filtered, paged and exported as the grid's own rows are. A side bar with
     * a `'pivot'` panel lets the reader build it by dragging fields; `v-model:pivot` keeps what they built.
     */
    pivot?: DataGridPivot;
    /**
     * A bar along the grid's side with panels opened from its tabs: `'columns'` lists every column to show, hide
     * or drag into another order; `'filters'` holds each filterable column's filter, open one at a time; `'pivot'`
     * builds a pivot by dragging the columns' fields into rows, columns and values; `'dictionary'` is the data
     * dictionary, every column with its `description` and `formula`, found by a search. `true` is the columns and the
     * filters, and the dictionary when a column has a description.
     */
    sideBar?: boolean | ('columns' | 'filters' | 'pivot' | 'dictionary')[];
    /** The side bar's panel open; `v-model:side-bar-open` follows the reader's tabs and opens one from the page. */
    sideBarOpen?: 'columns' | 'filters' | 'pivot' | 'dictionary' | null;
    /** A button by each header whose column has a `description`, which opens it. On by default. */
    columnInfo?: boolean;
    /**
     * Buttons over the grid: `'dictionary'`, `'columns'`, `'export'` (an Excel workbook) and `'density'` (how close
     * the rows sit, kept by `v-model:size`), or an object for a button of your own. `true` is the ones that apply.
     */
    toolbar?: boolean | DataGridToolbarItem[];

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
    /**
     * A button in each header that opens the column's menu: sort, pin, hide, reset. The function is handed
     * `{ column, key, items }` and answers with the items to offer instead.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    columnMenu?: boolean | ((context: { column: any; key: string; items: DataGridMenuItem[] }) => DataGridMenuItem[]);
    /**
     * A menu on a right click over a cell: copy the cell, copy the row, export. The function is handed
     * `{ row, index, column, key, value, items }` and answers with the items to offer instead.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    contextMenu?: boolean | ((context: { row: any; index: number; column: any; key: string; value: unknown; items: DataGridMenuItem[] }) => DataGridMenuItem[]);

    /**
     * Draws only the rows in view, and a few either side, in place of every row:
     * a hundred thousand rows cost what thirty do. The grid scrolls in
     * `scrollHeight` (400px when it has none); a row is measured once drawn, so
     * rows keep their own heights. The table still says how many rows it has, and
     * where each drawn one is.
     */
    virtualScroll?: boolean;
    /** Draws only the columns in view, past the pinned ones, which always are. A column without a `width` gets its `minWidth`, or 150px. */
    virtualColumns?: boolean;
    /** How many rows a virtual grid draws beyond each edge of the view. 6 by default. */
    overscan?: number;
    /** Every row this many pixels tall, its cells kept to one line that ends in an ellipsis. Without it a row is as tall as its content. */
    rowHeight?: number;
    /** Rows held at the top, under the header, while the rest scroll: a list, or a function of the rows the filters let through. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pinnedTopRows?: any[] | ((context: { rows: any[]; page: any[] }) => any[]);
    /** Rows held at the bottom while the rest scroll — the totals: a list, or a function of the rows the filters let through, so they follow the filters. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pinnedBottomRows?: any[] | ((context: { rows: any[]; page: any[] }) => any[]);

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

/** What a DataGrid's pivot puts where. */
export interface DataGridPivot {
    /** False keeps the pivot as set up but shows the rows themselves. True by default. */
    enabled?: boolean;
    rows: string[];
    columns?: string[];
    values: {
        field: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        aggregate?: 'sum' | 'avg' | 'min' | 'max' | 'count' | ((context: { rows: any[]; values: unknown[] }) => unknown);
        header?: string;
        /** How the value is drawn: text, or a node. */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        content?: (context: { value: unknown; rows: any[] }) => any;
    }[];
    /** A column of totals at the end. True by default. */
    totals?: boolean;
    totalsHeader?: string;
}

/** What a DataGrid's status bar counts. */
export interface DataGridStatusContext {
    /** Every row handed in. */
    total: number;
    /** The rows the filters let through. */
    filtered: number;
    selected: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rows: any[];
    /** What the cells marked as a range add up to, when some are. */
    range?: { count: number; numbers: number; sum: number; avg: number; min: number; max: number };
}

/** An item of a column's menu or a cell's: a label and what it does, or a separator. */
export interface DataGridMenuItem {
    label?: string;
    /** An icon of `@vitral/icons`, by name. */
    icon?: string;
    disabled?: boolean;
    separator?: boolean;
    onSelect?: () => void;
}

/** A change the reader made to a cell; the row already holds `newValue`. */
export interface DataGridCellEditEvent {
    originalEvent?: Event;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    row: any;
    index: number;
    /** The column, by `columnKey` or `field`. */
    key: string;
    field?: string;
    value: unknown;
    newValue: unknown;
}

export type DataGridEmits = {
    /** The block of cells marked changed: its rows (by index among every row) and columns, and the values in it. */
    'range-change': [event: { range: { rows: number[]; keys: string[] } | null; values: unknown[][] }];
    /** Many cells changed at once (a paste, a fill, a block emptied), as one step undo takes back. */
    'cells-change': [event: { originalEvent?: Event; source: 'paste' | 'fill' | 'clear'; changes: DataGridCellEditEvent[] }];
    /** A row was dragged, or moved with Ctrl and an arrow, to another place; `value` is the rows in their new order. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    'row-reorder': [event: { originalEvent?: Event; row: any; dragIndex: number; dropIndex: number; value: any[] }];
    /** A row of a tree was opened or shut. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    'tree-toggle': [event: { originalEvent?: Event; row: any; key: string | number; expanded: boolean }];
    /** The reader changed the pivot in the side bar: turned it on or off, or moved a field. */
    'pivot-change': [event: { pivot: DataGridPivot }];
    /** The reader picked how close the rows sit, from the toolbar. */
    'update:size': [size: 'small' | 'large' | undefined];
    /** A side bar's panel was opened or shut. */
    'update:sideBarOpen': [panel: 'columns' | 'filters' | 'pivot' | 'dictionary' | null];
    'update:pivot': [pivot: DataGridPivot];
    /** An editor opened in a cell. */
    'cell-edit-start': [event: Omit<DataGridCellEditEvent, 'newValue'>];
    /** A cell kept a new value, which is already in the row. */
    'cell-edit-complete': [event: DataGridCellEditEvent];
    /** An editor closed without keeping what was typed. */
    'cell-edit-cancel': [event: Omit<DataGridCellEditEvent, 'newValue'>];
    /** An edit was undone, or done again: the row holds `newValue` now. */
    'cell-edit-undo': [event: DataGridCellEditEvent & { redo: boolean }];
    /** A row edited as a whole was saved: every cell it changed, already in the row. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    'row-edit-save': [event: { originalEvent?: Event; row: any; index: number; changes: DataGridCellEditEvent[] }];
    /** A row edited as a whole was closed without saving. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    'row-edit-cancel': [event: { originalEvent?: Event; row: any; index: number }];
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
    /** The status bar's content, from what it counts; it draws the bar without `status-bar`. */
    status?: (props: DataGridStatusContext) => unknown;
    loadingicon?: () => unknown;
    paginatorstart?: (props: DataGridPageEvent) => unknown;
    paginatorend?: (props: DataGridPageEvent) => unknown;
    /** A row's detail, drawn under it once its `expander` column opens it. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expansion?: (props: { data: any; index: number }) => unknown;
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
    /** What the column holds: a button by its header opens it, and the side bar's data dictionary lists it. */
    description?: string;
    /** How the column's value is worked out, shown under its description. */
    formula?: string;
    footer?: string;
    sortable?: boolean;
    /** A column of selection controls: checkboxes with a select-all (`multiple`) or radios (`single`). */
    selectionMode?: 'single' | 'multiple';
    align?: 'left' | 'center' | 'right';
    filterPlaceholder?: string;
    /** The match mode a new filter value on this column uses when `filters` does not say. */
    filterMatchMode?: string;
    /**
     * In a DataGrid with `filter-display` `'menu'` or `'both'`, filters this column from a panel its header
     * opens: conditions on its values (`true` reads the kind, text, number or date, from the values), or
     * `'set'`, a list of its values to tick.
     */
    filter?: boolean | 'text' | 'number' | 'date' | 'set';
    /** The values a `'set'` filter lists, in place of the ones in the rows: what a server would have. */
    filterOptions?: unknown[];
    /** The ways a condition may compare, by match mode, in place of the ones its kind offers. */
    filterMatchModes?: string[];
    /** Offer this column's menu, when the DataGrid has `column-menu`. True by default. */
    menu?: boolean;
    hidden?: boolean;
    /**
     * In a DataGrid, a column of buttons that open each row's detail (the
     * `expansion` slot). In a TreeTable, the column that holds the expand
     * toggle and the indentation, the first column by default.
     */
    expander?: boolean;
    /** Include this column in a DataGrid's CSV export. Defaults to true for a column with a `field` or an `exportValue`. */
    exportable?: boolean;
    /** What a DataGrid's export writes for a row, in place of the field's value. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    exportValue?: (row: any) => unknown;
    /** The column's heading in a DataGrid's export, in place of `header`. */
    exportHeader?: string;
    /**
     * In a DataGrid, the reader can change this column's cells: every row's, or the rows the function allows.
     * A cell opens on a double click, Enter, F2 or by typing, and is kept with Enter or Tab or dropped with Escape.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    editable?: boolean | ((row: any) => boolean);
    /** Turns what was typed into the value kept. Without it, a number is read as a number, a date as a date. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parseValue?: (text: string, row: any) => unknown;
    /** Refuses a value with a message, and the editor stays open. Anything but a string lets it through. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    validate?: (value: unknown, row: any) => string | null | undefined | boolean;
    /** Writes a kept value into the row. Without it, the value goes into `field`. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setValue?: (row: any, value: unknown) => void;
    /** A column of buttons that edit a row as a whole: Edit, then Save and Cancel. */
    rowEditor?: boolean;
    /**
     * A value worked out over rows: `'sum'`, `'avg'`, `'min'`, `'max'` or `'count'`, or a function of the rows and
     * their values in this column. In a DataGrid it is drawn under this column on each group's heading; in a
     * TreeTable, on each row with rows under it, over the rows its branches end in, in place of the row's own value.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    aggregate?: 'sum' | 'avg' | 'min' | 'max' | 'count' | ((context: { rows: any[]; values: unknown[] }) => unknown);
    /** In a DataGrid, a handle that drags the row to another place, or moves it with Ctrl and an arrow key. */
    rowDrag?: boolean;
    headerClass?: unknown;
    headerStyle?: unknown;
    bodyClass?: unknown;
    bodyStyle?: unknown;
}

/** A heading over a run of `<Column>`s, which go in its default slot; groups nest. */
export interface ColumnGroupProps {
    header?: string;
    /** Identifies the group, for its heading's `data-group`; its place among the groups by default. */
    columnKey?: string;
    /** Where its heading sits over its columns: centred by default. */
    align?: 'left' | 'center' | 'right';
    /** Leaves the group out, with every column in it. */
    hidden?: boolean;
    headerClass?: unknown;
    headerStyle?: unknown;
}

export interface ColumnGroupSlots {
    /** The `<Column>`s, or further `<ColumnGroup>`s, under this heading. */
    default?: () => unknown;
    /** The heading, drawn in place of `header`. */
    header?: (props: { column: Record<string, unknown> }) => unknown;
}

export interface ColumnSlots {
    /** A cell. `pinned` is set on a row pinned to the top or the bottom, which a cell may draw differently — a total, say. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body?: (props: { data: any; field?: string; index: number; column: Record<string, unknown>; pinned?: 'top' | 'bottom' }) => unknown;
    header?: (props: { column: Record<string, unknown> }) => unknown;
    /** The column's description, drawn in place of `description`, by its header and in the data dictionary. */
    description?: (props: { column: Record<string, unknown> }) => unknown;
    footer?: (props: { column: Record<string, unknown> }) => unknown;
    /** A custom filter control. Set `filterModel.value` (then call `filterCallback()` if the object is not reactive). */
    filter?: (props: { field: string; filterModel: FilterConstraintLike | CompositeFilterLike | undefined; filterCallback: () => void }) => unknown;
    /**
     * The editor of a DataGrid cell, in place of the text box: call `setValue` as the value changes, and
     * `commit` or `cancel` when done (Enter, Tab and Escape do it too). `error` is why a value was refused.
     */
    editor?: (props: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: any;
        field?: string;
        index: number;
        column: Record<string, unknown>;
        value: unknown;
        error?: string;
        errorId: string;
        setValue: (value: unknown) => void;
        commit: () => void;
        cancel: () => void;
    }) => unknown;
    /** The value worked out by `aggregate`, as drawn on a DataGrid group's heading or a TreeTable's parent row. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    aggregate?: (props: { value: unknown; rows: any[]; column: Record<string, unknown>; node?: any }) => unknown;
    /** A cell of a placeholder row, while a DataGrid loads as `skeleton`: `index` is the row's. Without it, a bar a line of text tall. */
    skeleton?: (props: { column: Record<string, unknown>; index: number }) => unknown;
}

/** A button of a DataGrid's toolbar: one the grid knows by name, or one of your own. */
export type DataGridToolbarItem = 'dictionary' | 'columns' | 'export' | 'density' | { key: string; label: string; icon?: string; showLabel?: boolean; onClick: (event: MouseEvent) => void };
