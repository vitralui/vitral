import type { ClassEntry, ColumnLayout, DataSource, FilterMeta, Locale, SortMeta } from '@vitral/core';
import type { PassThrough, ScrollbarMode } from '@vitral/dom';

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
    column: DataGridColumn<T>;
    /** Set on a row pinned to the top or the bottom of the grid, which a cell may draw differently (a total, say). */
    pinned?: 'top' | 'bottom';
    /**
     * The key of the column the cell is drawn in. Usually `column`'s own; a
     * pivot draws each value with the column it came from, once under every
     * heading across the top, and this tells those cells apart.
     */
    key?: string;
}

/**
 * What an editor is given: the cell, the value as it stands in the editor, and
 * how to change it, keep it or drop it. An editor a host draws calls
 * `setValue` as the reader types, and `commit` or `cancel` when it is done;
 * the grid does the same on Enter, Tab and Escape.
 */
export interface EditorContext<T = Row> {
    row: T;
    index: number;
    field?: string;
    /** The value in the editor: what the cell held, until the reader changes it. */
    value: unknown;
    column: DataGridColumn<T>;
    /** Why the value was refused, while it is. */
    error?: string;
    /** The id the editor's message is drawn under, for `aria-errormessage`. */
    errorId: string;
    setValue: (value: unknown) => void;
    commit: () => void;
    cancel: () => void;
}

/** Content a host draws itself: a string, a node it made, or nothing. */
export type Content = string | number | Node | null | undefined;

export type PaginatorItem = 'FirstPageLink' | 'PrevPageLink' | 'PageLinks' | 'NextPageLink' | 'LastPageLink' | 'RowsPerPageDropdown' | 'CurrentPageReport';

export interface DataGridColumn<T = Row> {
    /** Identifies the column when `field` does not (two columns on one field, or none). */
    key?: string;
    /**
     * Makes this a group of columns rather than a column: its `header` is drawn
     * over theirs, across all of them, and groups nest. Only the columns are
     * sorted, filtered, moved and sized; a column moved away from the rest of
     * its group splits the heading in two, as a pinned one does.
     */
    columns?: DataGridColumn<T>[];
    /** The field (dotted path) a cell shows, sorts and filters by. */
    field?: string;
    header?: string;
    /**
     * What the column holds, in a sentence or two. A button by its header
     * opens it, and the side bar's data dictionary lists it with the rest.
     */
    description?: string;
    /** How the column's value is worked out, shown under its description. */
    formula?: string;
    /** Whether the column says what a row is about (`'dimension'`) or measures it (`'metric'`), drawn as a tag by its name. */
    kind?: 'dimension' | 'metric';
    /** Where the value comes from, in a line under the description: a table and field, a system. */
    source?: string;
    /** Rules and exceptions worth a warning: "Can be empty", "Orders without a customer are left out". */
    notes?: string | string[];
    footer?: string;
    sortable?: boolean;
    sortField?: string;
    filterField?: string;
    filterPlaceholder?: string;
    filterMatchMode?: string;
    /**
     * Filters this column from a panel its header opens, when the grid's
     * `filterDisplay` takes in `'menu'`: conditions on its values (`true`
     * reads the kind — text, number or date — from the values themselves), or
     * `'set'`, a list of its values to tick.
     */
    filter?: boolean | 'text' | 'number' | 'date' | 'set';
    /**
     * The values a `'set'` filter lists, in place of the ones in the rows:
     * what a server would have. Given as `{ label, value }`, the panel shows
     * the label and the filter keeps the value.
     */
    filterOptions?: unknown[] | { label: string; value: unknown }[];
    /** How a `'set'` filter names a value, when the value is a code the reader should not see (`'quote'` as "Orçamento"). */
    filterLabel?: (value: unknown) => string;
    /** Draws a `'set'` filter's value, in place of its label: a tag in the colour the cells use, say. */
    filterOptionContent?: (context: { value: unknown; label: string; column: DataGridColumn<T> }) => Content;
    /** The ways a condition may compare, by match mode, in place of the ones its kind offers. */
    filterMatchModes?: string[];
    /** Offer this column's menu, when the grid has `columnMenu`. True by default. */
    menu?: boolean;
    /** A column of selection controls: checkboxes with a select-all (`multiple`) or radios (`single`). */
    selectionMode?: 'single' | 'multiple';
    /** A column of buttons that open each row's detail, drawn by `content.rowExpansion`. */
    expander?: boolean;
    align?: 'left' | 'center' | 'right';
    /** Leaves the column out altogether: no cell, no place in the columns panel or the data dictionary. */
    hidden?: boolean;
    /**
     * False starts the column hidden, as the reader would hide it: listed in
     * the columns panel and the data dictionary, to be shown from there. The
     * reader's layout decides from then on. True by default.
     */
    visible?: boolean;
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
    /**
     * The reader can change this column's cells: every row's, or the rows the
     * function allows. A cell is edited on a double click, Enter, F2 or by
     * typing into it, and kept with Enter or Tab or dropped with Escape.
     */
    editable?: boolean | ((row: T) => boolean);
    /**
     * Draws the editor, in place of the text box the grid draws: a select, a
     * date picker, anything that calls `setValue` and `commit`.
     */
    editor?: (context: EditorContext<T>) => Content;
    /**
     * Turns what was typed into the value kept. Without it, the text box reads
     * a number into a number, a date into a date and a boolean into a boolean,
     * the kind the cell held before.
     */
    parseValue?: (text: string, row: T) => unknown;
    /** Refuses a value: a message says why, and the editor stays open. Anything but a string lets it through. */
    validate?: (value: unknown, row: T) => string | null | undefined | boolean;
    /** Writes a kept value into the row. Without it, the value goes into `field`. */
    setValue?: (row: T, value: unknown) => void;
    /**
     * A column of buttons that edit a row as a whole: Edit, then Save and
     * Cancel. For a grid whose `editMode` is `'row'`.
     */
    rowEditor?: boolean;
    /**
     * A value worked out over a group's rows, drawn under this column on the
     * group's heading: `'sum'`, `'avg'`, `'min'`, `'max'` or `'count'`, or a
     * function of the rows and their values in this column.
     */
    aggregate?: 'sum' | 'avg' | 'min' | 'max' | 'count' | ((context: { rows: T[]; values: unknown[] }) => unknown);
    /** How the value worked out over a group is drawn; a number in the reader's own way by default. */
    aggregateContent?: (context: { value: unknown; rows: T[]; column: DataGridColumn<T> }) => Content;
    /** A handle that drags the row to another place, or moves it with Ctrl and an arrow key. */
    rowDrag?: boolean;
    /** Include this column in `toCSV()` and `exportCSV()`. Defaults to true for a column with a `field` or an `exportValue`. */
    exportable?: boolean;
    /** What an export writes for a row, in place of the field's value: a formatted date, a name for an id. */
    exportValue?: (row: T) => unknown;
    /** The column's heading in an export, in place of `header`. */
    exportHeader?: string;
    /** Draws the header, beside or instead of `header`. */
    headerContent?: (context: { column: DataGridColumn<T> }) => Content;
    /** Draws the description, in place of `description`: in the popover by its header (`'info'`), or in the data dictionary. */
    descriptionContent?: (context: { column: DataGridColumn<T>; place: 'info' | 'dictionary' }) => Content;
    footerContent?: (context: { column: DataGridColumn<T> }) => Content;
    /** Draws the filter control for this column, instead of the text box. */
    filterContent?: (context: { column: DataGridColumn<T>; value: unknown; setValue: (value: unknown) => void }) => Content;
    /**
     * Draws the cell of a placeholder row, when the table loads as `skeleton`.
     * Without it, a bar the height of a line of text; a selection column draws
     * the box its control will be.
     */
    skeleton?: (context: { column: DataGridColumn<T>; index: number }) => Content;
}

/** An item of a column's menu or a cell's: a label and what it does, or a separator. */
export interface GridMenuItem {
    label?: string;
    /** An icon of `@vitral/icons`, by name. */
    icon?: string;
    disabled?: boolean;
    separator?: boolean;
    onSelect?: () => void;
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
export interface DataGridContent<T = Row> {
    /** The bar above the table, beside the column list. */
    header?: () => Content;
    /** The bar below it. */
    footer?: () => Content;
    /** What an empty table says, instead of the message. */
    empty?: () => Content;
    /** A row's detail, drawn across the table under the row once its expander opens it. */
    rowExpansion?: (context: { row: T; index: number }) => Content;
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

/** A change the reader made to a cell. */
export interface CellEditEvent<T = Row> {
    originalEvent?: Event;
    row: T;
    /** Its index among the rows on show. */
    index: number;
    /** The column, by key. */
    key: string;
    field?: string;
    value: unknown;
    newValue: unknown;
}

import type { PivotConfig } from './pivot';

/** What a status bar counts. */
export interface StatusContext<T = Row> {
    /** Every row handed in. */
    total: number;
    /** The rows the filters let through. */
    filtered: number;
    selected: number;
    rows: T[];
    /** What the cells marked as a range add up to, when some are. */
    range?: { count: number; numbers: number; sum: number; avg: number; min: number; max: number };
}

export interface DataGridEvents<T = Row> {
    /** A row was dragged, or moved with the keyboard, to another place; `value` is the rows in their new order. */
    'row-reorder'?: (event: { originalEvent?: Event; row: T; dragIndex: number; dropIndex: number; value: T[] }) => void;
    /** The block of cells marked changed: its rows (by index among every row) and columns, and the values in it. */
    'range-change'?: (event: { range: { rows: number[]; keys: string[] } | null; values: unknown[][] }) => void;
    /** Many cells changed at once — a paste, a fill, a block emptied — as one step undo takes back. */
    'cells-change'?: (event: { originalEvent?: Event; source: 'paste' | 'fill' | 'clear'; changes: CellEditEvent<T>[] }) => void;
    /** The reader changed the pivot in the side bar: turned it on or off, or moved a field. */
    'pivot-change'?: (event: { pivot: PivotConfig<T> }) => void;
    /** The reader picked how close the rows sit, from the toolbar. */
    'size-change'?: (event: { size: 'small' | 'large' | undefined }) => void;
    /** A panel of the side bar was opened or shut. */
    'side-panel-change'?: (event: { panel: 'columns' | 'filters' | 'pivot' | 'dictionary' | null }) => void;
    /** A row of a tree was opened or shut. */
    'tree-toggle'?: (event: { originalEvent?: Event; row: T; key: string | number; expanded: boolean }) => void;
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
    /** An editor opened in a cell. */
    'cell-edit-start'?: (event: Omit<CellEditEvent<T>, 'newValue'>) => void;
    /** A cell kept a new value, which is already in the row. */
    'cell-edit-complete'?: (event: CellEditEvent<T>) => void;
    /** An editor closed without keeping what was typed. */
    'cell-edit-cancel'?: (event: Omit<CellEditEvent<T>, 'newValue'>) => void;
    /** A row being edited as a whole was saved: every cell it changed, already in the row. */
    'row-edit-save'?: (event: { originalEvent?: Event; row: T; index: number; changes: CellEditEvent<T>[] }) => void;
    'row-edit-cancel'?: (event: { originalEvent?: Event; row: T; index: number }) => void;
    /** An edit was undone, or done again: the row holds `newValue` now. */
    'cell-edit-undo'?: (event: CellEditEvent<T> & { redo: boolean }) => void;
    /** Anything the reader changed: the models a framework binds back. */
    change?: (state: DataGridModels) => void;
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
export interface DataGridModels {
    first: number;
    rows: number;
    sortField: string | null;
    sortOrder: 1 | -1 | null;
    multiSortMeta: SortMeta[];
    filters: FilterMeta;
    selection: unknown;
    columnLayout: ColumnLayout;
    /** The keys of the groups the reader has shut, when the grid is grouped. */
    collapsedGroups: string[];
    /** The keys (by `dataKey`) of the rows whose detail is open. */
    expandedRows: (string | number)[];
    /** The keys (by `dataKey`) of the rows of a tree whose rows show under them. */
    expandedTree: (string | number)[];
}

/** The rows a pinned band holds: a list, or a function of the rows the query let through (totals that follow the filters). */
export type PinnedRows<T = Row> = T[] | ((context: { rows: T[]; page: T[] }) => T[]);

export interface DataGridConfig<T = Row> extends Partial<DataGridModels> {
    /**
     * Gathers the rows by this field and puts a heading over each run, with a
     * count and a toggle. The grouping happens after the query, so sorting and
     * filtering still decide which rows there are and what order they come in.
     * Rows are gathered by value rather than by adjacency, so sorting by some
     * other column keeps the groups together and sorts inside them. A list
     * groups by each field in turn: groups inside groups.
     */
    groupBy?: string | string[];
    /** What a group's heading says; the value itself by default. */
    groupLabel?: (context: { value: unknown; count: number; rows: T[]; field: string; level: number }) => string;
    /**
     * The rows hold rows of their own, found in this field or by this
     * function: a tree, each row's rows under it with a toggle to show them.
     * Sorting orders the rows beside one another; a filter keeps a row that
     * matches and the rows above it, and opens the way down to it.
     */
    treeData?: string | ((row: T) => T[] | null | undefined);
    /**
     * A bar under the grid that counts the rows: how many, how many the
     * filters let through, how many are selected. The function is handed those
     * counts and the rows, and draws the bar's content instead.
     */
    statusBar?: boolean | ((context: StatusContext<T>) => Content);
    /**
     * Cells can be marked as a block: dragged over, or reached with Shift and
     * the arrows, Ctrl+A for all. Ctrl+C copies the block as a spreadsheet
     * does, Delete empties what can be edited in it, and the status bar adds
     * up its numbers. Moves the keyboard through cells.
     */
    cellSelection?: boolean;
    /** A handle at the marked block's corner: dragged down or across, it carries the block's values on. */
    fillHandle?: boolean;
    /** Ctrl+V pastes text from a spreadsheet into the cells that can be edited. On by default; `false` turns it off. */
    clipboard?: boolean;
    /**
     * A cell whose value changes flashes, up or down for a number: live
     * values a reader can follow. A number is how long, in milliseconds.
     */
    flashCells?: boolean | number;
    /**
     * Turns the rows about: the values of `rows` fields down the side, the
     * values of `columns` fields across the top, and in each cell `values`
     * worked out over the rows that meet there. The pivot is sorted,
     * filtered, paged and exported as the grid's own rows are.
     */
    pivot?: PivotConfig<T>;
    /**
     * A bar along the grid's side with panels the reader opens from its tabs:
     * `'columns'` lists every column to show, hide or drag into another
     * order; `'filters'` holds each column's filter, open one at a time;
     * `'pivot'` builds a pivot from the columns' fields, by dragging them
     * into rows, columns and values; `'dictionary'` is the data dictionary,
     * every column with what it holds and how it is worked out, found by a
     * search. `true` is the columns and the filters, and the dictionary when
     * a column has a description.
     */
    sideBar?: boolean | ('columns' | 'filters' | 'pivot' | 'dictionary')[];
    /** The side bar's panel open at first; none by default. */
    sideBarOpen?: 'columns' | 'filters' | 'pivot' | 'dictionary' | null;
    /** Over the data dictionary: the module the table belongs to, in small capitals, and a line under its title. */
    dictionaryModule?: string;
    dictionarySubtitle?: string;
    /**
     * Whether a header's menu button is always there (`'always'`, the
     * default: a touch screen has no pointer to bring it out) or only while
     * the header is pointed at or focused (`'hover'`).
     */
    headerTools?: 'always' | 'hover';
    /**
     * The least height of the box the rows scroll in — a CSS length — so a
     * grid with few rows or none keeps its shape, the empty message in the
     * middle of it.
     */
    minHeight?: string;
    /**
     * Keeps what the reader arranged between visits, under this name in the
     * browser's storage: the columns' order, widths, pins and the ones hidden,
     * the sort, the page size and how close the rows sit. What was kept wins
     * over the starting values handed in; "Reset columns" in a column's menu
     * puts the columns back.
     */
    stateKey?: string;
    /**
     * The button by a header whose column has a `description`, which opens
     * it by a press, a tap or the keyboard. False leaves the description to
     * the data dictionary. True by default.
     */
    columnInfo?: boolean;
    /**
     * Buttons over the grid, at the end of its header bar: `'dictionary'`
     * opens the data dictionary, `'columns'` the columns panel (or the column
     * list), `'export'` writes an Excel workbook, `'density'` picks how close
     * the rows sit; an object is a button of the host's own. `true` is the
     * ones that apply: the dictionary when a column has a description, the
     * export, the density, and the columns.
     */
    toolbar?: boolean | DataGridToolbarItem[];
    /** The rows; with `lazy`, only the current page. */
    value?: T[];
    columns?: DataGridColumn<T>[];
    /** A field that identifies a row, for selection and row keys. */
    dataKey?: string;
    /** Rows come from a data source, local or remote, instead of `value`. */
    dataSource?: DataSource<T>;
    /** Nothing is computed here: the changes are reported for the host to answer. */
    lazy?: boolean;
    totalRecords?: number;
    loading?: boolean;
    /**
     * How the table waits. `'mask'` covers it with a spinner and keeps the rows
     * it had; `'skeleton'` draws placeholder rows in its own cells instead, so
     * the table has the shape it will have when the rows arrive.
     */
    loadingMode?: 'mask' | 'skeleton';
    /**
     * How many placeholder rows a skeleton draws. By default, as many as the
     * page holds now, so a table that is fetching again does not change height;
     * with none, a page's worth when paginated, and 5 when not.
     */
    skeletonRows?: number;

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
    /**
     * `'row'` puts a filter box under each filterable column's header; `'menu'`
     * a button in the header that opens the column's filter panel; `'both'`, both.
     */
    filterDisplay?: 'row' | 'menu' | 'both';
    filterDelay?: number;

    selectionMode?: 'single' | 'multiple';

    /**
     * What the keyboard moves through: rows (the default), or cells, which the
     * arrow keys, Home, End and the page keys move between, as in a
     * spreadsheet. A grid with an editable column moves through cells unless
     * told otherwise.
     */
    navigation?: 'row' | 'cell';
    /** `'cell'` (the default) edits a cell at a time; `'row'` opens every editable cell of a row at once, saved or dropped together. */
    editMode?: 'cell' | 'row';
    /** A single click opens a cell's editor, rather than a double click. */
    editOnClick?: boolean;
    /** Ctrl+Z and Ctrl+Y (⌘ on a Mac) undo and redo the reader's edits. On by default; `false` turns them off. */
    undoRedo?: boolean;

    resizableColumns?: boolean;
    columnResizeMode?: 'fit' | 'expand';
    reorderableColumns?: boolean;
    columnToggle?: boolean;
    /** A name two tables share: they scroll sideways together and keep one column layout. */
    group?: string;
    /**
     * A button in each header that opens the column's menu: sort, pin, fit,
     * hide. The function is handed the column and the items the grid would
     * offer, and answers with the items to offer instead.
     */
    columnMenu?: boolean | ((context: { column: DataGridColumn<T>; key: string; items: GridMenuItem[] }) => GridMenuItem[]);
    /**
     * A menu on a right click (or Shift+F10) over a cell: copy the cell, copy
     * the row, export. The function is handed the cell and the items the grid
     * would offer, and answers with the items to offer instead.
     */
    contextMenu?: boolean | ((context: { row: T; index: number; column: DataGridColumn<T>; key: string; value: unknown; items: GridMenuItem[] }) => GridMenuItem[]);

    /**
     * Draws only the rows in view, and a few either side, in place of every
     * row: a hundred thousand rows cost what thirty do. The grid scrolls in
     * `scrollHeight` (400px when it has none); a row is measured once drawn, so
     * rows keep their own heights. The table still says how many rows it has,
     * and where each drawn one is, through `aria-rowcount` and `aria-rowindex`.
     */
    virtualScroll?: boolean;
    /**
     * Draws only the columns in view, past the pinned ones, which always are.
     * The grid is then laid out by the columns' widths: a column without one
     * gets `minWidth`, or 150px.
     */
    virtualColumns?: boolean;
    /** How many rows a virtual grid draws beyond each edge of the view, so a quick scroll does not show a gap. 6 by default. */
    overscan?: number;
    /**
     * Every row this many pixels tall, its cells kept to one line that ends in
     * an ellipsis. Without it a row is as tall as its content, which may wrap.
     */
    rowHeight?: number;
    /** Rows held at the top of the grid, under the header, while the rest scroll: a target, a row to compare with. */
    pinnedTopRows?: PinnedRows<T>;
    /** Rows held at the bottom of the grid, over the footer, while the rest scroll: the totals, worked out from the rows the filters let through. */
    pinnedBottomRows?: PinnedRows<T>;

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
    /**
     * The bars of the box the table scrolls in, and of the column list: the
     * theme's drawn bars, shown under the pointer (`'hover'`, the default) or
     * always (`'always'`), or the browser's own (`'native'`).
     */
    scrollbar?: ScrollbarMode;
    /** Arrows at the ends of the drawn bars, as a native bar has. Off by default. */
    scrollbarArrows?: boolean;
    classes?: Partial<Record<string, ClassEntry>>;
    pt?: PassThrough;
    /** Prefix of the ids the table gives its elements; generated when unset. */
    id?: string;
    /** What the host draws itself. */
    content?: DataGridContent<T>;
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
    on?: DataGridEvents<T>;
}

/** A button of the grid's toolbar: one the grid knows by name, or the host's own. */
export type DataGridToolbarItem =
    | 'dictionary'
    | 'columns'
    | 'export'
    | 'density'
    | {
          key: string;
          label: string;
          /** An icon by name; the label is then only said, unless `showLabel`. */
          icon?: string;
          showLabel?: boolean;
          onClick: (event: MouseEvent) => void;
      };
