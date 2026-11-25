import { formatMessage, getField, MIN_COLUMN_WIDTH, pageCount, pageLinks, pageOf, pageReportParams, type FilterMeta, type Locale } from '@vitral/core';
import { aggregateOf, type GridLine } from '../engine/rows';
import type { RangeBox } from '../engine/range';
import { h, iconNode, mergeAttrs, type Child, type Props, type VElement } from '@vitral/dom';
import { getIcon } from '@vitral/icons';
import type { FilterKind } from '../engine/filters';
import { cellText, expansionKey, groupDepth, groupTitle, isExpanded, isFilterable, rowKey, type ColumnGroupRef, type ResolvedColumn, type ResolvedRows } from '../engine/state';
import type { VirtualWindow } from '../engine/virtual';
import { cellValue, editorKind, isEditable, type EditorKind } from '../engine/edit';
import type { CellContext, Content, PageContext, Row, DataGridAggregate, DataGridColumn, DataGridConfig, DataGridModels, StatusContext } from '../engine/types';
import { drawerView, type ColumnsDrawerView, type DrawerTab } from './drawer';
import { sparklineDomain, sparklinePoints, sparklineView } from './sparkline';

/**
 * The table as plain objects. It is drawn in boxes rather than a `<table>`,
 * as a spreadsheet draws its cells: one CSS grid holds every column's track,
 * and each row is a subgrid of it, so a column is as wide in every row as it
 * is in its header, a pinned column sticks to its edge, and a row is the
 * height it is told. The roles a `<table>` would carry are written out —
 * `table`, `grid` or `treegrid`, row groups, rows, column headers and cells —
 * so a screen reader reads the same table. A sortable header holds a button
 * that carries the sort, and the paginator is buttons. What is drawn is
 * decided here; what happens when it is pressed is the handle's.
 */

/** Everything the view needs that is not the configuration itself. */
export interface ViewContext<T = Row> {
    config: DataGridConfig<T>;
    models: DataGridModels;
    columns: ResolvedColumn<T>[];
    /**
     * The columns a row draws, in order: every one, or, when columns are drawn
     * as they come into view, the ones in view with a spacer for the room of
     * those left out on either side.
     */
    drawn: DrawnColumn<T>[];
    rows: ResolvedRows<T>;
    /** The rows held at the top and the bottom of the grid while the rest scroll. */
    pinnedTop: T[];
    pinnedBottom: T[];
    /** Set when only the rows in view are drawn. */
    virtual?: VirtualRows;
    /** Set when the keyboard moves through cells: the one in the tab order. */
    cellFocus?: { index: number; key: string };
    /** The cells open for editing, when some are. */
    editing?: EditingView;
    /** What the live region says: an edit undone or done again. */
    announcement: string;
    /** The page as the lines to draw: a heading over each run, or just the rows. */
    lines: GridLine<T>[];
    filters: FilterMeta;
    locale: Locale;
    ids: { table: string; list: string; caption: string };
    busy: boolean;
    /** The classes and pass-through of one part in one state. */
    part: (name: string, state?: unknown) => Props;
    /** The same, for the paginator's own parts: it wears the paginator's classes wherever it is drawn. */
    pagePart: (name: string, state?: unknown) => Props;
    /** What the reader can do. */
    on: DataGridActions<T>;
    /** `'all'`, `'some'` or `'none'` over the rows select-all covers. */
    allState: 'all' | 'some' | 'none';
    /** Whether one row is selected; the handle knows the models and the data key. */
    selected: (row: T) => boolean;
    selectionKind?: 'single' | 'multiple';
    sorts: { field: string; order: 1 | -1 }[];
    /** Which row keeps the tab stop, when rows are focusable. */
    tabRow: number;
    /** The column list, when the table offers one. */
    chooser: {
        open: boolean;
        columns: { key: string; header: string; visible: boolean; last: boolean }[];
    };
    /** A column being dragged, and the one it would land before. */
    dragging: string | null;
    dropOn: string | null;
    /** The column whose edge is being dragged, if one is. */
    resizing: string | null;
    /**
     * The buttons a header draws besides its title, the column whose panel or
     * menu is open, and the one whose description is open.
     */
    menus: { filter: boolean; column: boolean; open: string | null; info: boolean; infoOpen: string | null };
    /** The buttons over the grid, when it has a toolbar. */
    toolbar?: ToolbarView[];
    /** The columns drawer, while it is open. */
    drawer?: ColumnsDrawerView;
    /** The rows drawn as cards of labelled cells (`responsiveLayout: 'stack'`, under the breakpoint). */
    stacked?: boolean;
    /** Empty rows down to the box's foot: as high as a row, and whether the rows above are an odd count. */
    fillRows?: { height: number; odd: boolean };
    /** The data dictionary's drawer, while it is open. */
    dictionaryDrawer?: DictionaryView;
    /** The filter panel, while one is open. */
    filterPanel?: FilterPanelView;
    /** A row being dragged, and where it would land: before or after the row at that index. */
    rowDrag?: { index: number; over: number | null; after: boolean };
    /** The counts the status bar shows, when it shows. */
    status?: StatusContext<T>;
    /** The block of cells marked, the block a fill would grow it to (the cells it writes are the ones past it), and whether the fill handle is drawn. */
    range?: { box: RangeBox; fill: RangeBox | null; handle: boolean };
    /** The side bar, when the grid has one: its tabs, the panel open, and what the panels list. */
    sideBar?: SideBarView;
}

export type SidePanel = 'columns' | 'filters' | 'pivot' | 'dictionary';

/** A toolbar button as it is drawn: its label, its icon, whether the label shows, and what it opens. */
export interface ToolbarView {
    key: string;
    label: string;
    icon?: string;
    showLabel: boolean;
    pressed?: boolean;
    popup?: 'menu';
}

/** A column in the data dictionary: what it holds, how it is worked out, and whether it is on show. */
export interface DictionaryEntry extends ColumnAbout {
    key: string;
    header: string;
    visible: boolean;
}

/** What a column says about itself: what it holds, how it is worked out, where it comes from, its rules. */
export interface ColumnAbout {
    description: Content;
    formula?: string;
    kind?: 'dimension' | 'metric';
    source?: string;
    notes?: string[];
}
export type PivotZone = 'rows' | 'columns' | 'values';

/** The pivot panel: whether the pivot is on, what is in each place, and the fields to take from. */
export interface PivotPanelView {
    enabled: boolean;
    rows: { field: string; header: string }[];
    columns: { field: string; header: string }[];
    /** `control` is the select that says how the value is worked out. */
    values: { field: string; header: string; control?: Content }[];
    fields: { field: string; header: string; used: boolean }[];
    dragging: { field: string; from: PivotZone | 'fields' } | null;
    dropZone: PivotZone | 'fields' | null;
    dropBefore: string | null;
}

export interface SideBarView {
    panels: SidePanel[];
    open: SidePanel | null;
    search: string;
    columns: { key: string; header: string; visible: boolean; last: boolean }[];
    filters: { key: string; header: string; active: boolean; open: boolean }[];
    /** A column of the list being dragged, and the one it would land before. */
    dragging: string | null;
    dropOn: string | null;
    pivot?: PivotPanelView;
    dictionary?: DictionaryEntry[];
    /** The module the table belongs to and a line under the dictionary's title. */
    dictionaryModule?: string;
    dictionarySubtitle?: string;
}

/** A column's filter panel as it is drawn: conditions on its values, or a list of them to tick. */
export interface FilterPanelView {
    key: string;
    header: string;
    kind: FilterKind;
    /** Two conditions and the word joining them; the second is offered once the first has a value. */
    operator: 'and' | 'or';
    /** What each condition's box holds, as typed. */
    texts: [string, string];
    /** The control choosing how each condition compares. */
    modes: [Content, Content];
    /** The values to tick, as many as are drawn, and how many more the search would find. */
    values: { label: string; checked: boolean; content?: Content }[];
    more: number;
    search: string;
    all: 'all' | 'some' | 'none';
}

/** The cells of a row open for editing, and what is typed in them. */
export interface EditingView {
    index: number;
    keys: string[];
    /** What each editor holds: the text typed, or a box's checked state. */
    values: Record<string, unknown>;
    /** The kind of box each was opened as, by the value it held. */
    kinds: Record<string, EditorKind>;
    errors: Record<string, string>;
    /** The whole row, saved or dropped together. */
    row: boolean;
}

/** The room a run of columns left out of view would take, drawn as one empty cell. */
export interface ColumnSpacer {
    spacer: true;
    key: string;
    width: number;
}

export type DrawnColumn<T = Row> = ResolvedColumn<T> | ColumnSpacer;

const isSpacer = <T>(entry: DrawnColumn<T>): entry is ColumnSpacer => 'spacer' in entry;

/** The rows a virtual grid draws, and what a reader of the whole table is told about the rest. */
export interface VirtualRows {
    /** Over the lines: which are drawn, and the room above and below them. */
    window: VirtualWindow;
    /** The `aria-rowindex` of each line's row, from 1 and counting the header's rows. */
    rowIndex: (line: number) => number;
    /** How many rows the table has, header, pinned and detail rows included. */
    rowCount: number;
    /** How many rows come before the first line drawn, which keeps the stripes where they were. */
    rowsBefore: number;
}

export interface DataGridActions<T = Row> {
    sort: (column: ResolvedColumn<T>, event: MouseEvent) => void;
    setFilter: (column: ResolvedColumn<T>, value: unknown) => void;
    page: (first: number, rows: number) => void;
    /** A new page size, keeping the first row on screen. */
    pageSize: (rows: number) => void;
    toggleRow: (row: T, index: number, event: Event, type: 'row' | 'checkbox' | 'radio') => void;
    toggleAll: (event: Event) => void;
    rowClick: (row: T, index: number, event: MouseEvent) => void;
    rowKeydown: (event: KeyboardEvent, index: number) => void;
    /** Opens or shuts one group of a grouped grid. */
    toggleGroup: (key: string) => void;
    /** Opens or shuts one row's detail. */
    toggleExpansion: (key: string | number) => void;
    resizeStart: (column: ResolvedColumn<T>, event: PointerEvent) => void;
    resizeKey: (column: ResolvedColumn<T>, event: KeyboardEvent) => void;
    headerKeydown: (column: ResolvedColumn<T>, event: KeyboardEvent) => void;
    dragStart: (column: ResolvedColumn<T>, event: DragEvent) => void;
    dragOver: (event: DragEvent) => void;
    drop: (event: DragEvent) => void;
    dragEnd: () => void;
    pin: (column: ResolvedColumn<T>, side: 'left' | 'right' | null, event: Event) => void;
    setVisible: (key: string, visible: boolean, event: Event) => void;
    toggleChooser: () => void;
    /** The button the column list hangs from, as it is drawn. */
    chooserButton: (element: Element | null) => void;
    /** Gives a button that shows only an icon the words it stands for, as a tooltip; `undefined` takes it away. */
    tip: (element: Element | null, text: string | undefined) => void;
    scrolled: (event: Event) => void;
    /** The keyboard, clicks and double clicks over the cells: moving between them and editing them. */
    gridKeydown: (event: KeyboardEvent) => void;
    gridClick: (event: MouseEvent) => void;
    gridDblclick: (event: MouseEvent) => void;
    /** What an editor now holds; `redraw` for an editor the host draws, which shows the value it is given. */
    editInput: (key: string, value: unknown, redraw?: boolean) => void;
    commitEdit: (event?: Event) => void;
    cancelEdit: (event?: Event) => void;
    /** The row editor's Edit button. */
    editRow: (index: number, event: Event) => void;
    /** The box the table scrolls in, and the column list's: where the drawn bars go. */
    scroller: (element: Element | null) => void;
    chooserScroller: (element: Element | null) => void;
    /** A header's buttons: the filter panel, and the column's menu. */
    openFilter: (column: ResolvedColumn<T>, event: MouseEvent) => void;
    openColumnMenu: (column: ResolvedColumn<T>, event: MouseEvent) => void;
    /** What the filter panel's controls do. */
    filterText: (at: 0 | 1, text: string) => void;
    filterOperator: (operator: 'and' | 'or') => void;
    filterSearch: (text: string) => void;
    filterTick: (index: number, checked: boolean) => void;
    filterAll: (checked: boolean) => void;
    clearFilter: () => void;
    /** A right click, or the menu key, over a cell. */
    gridContextmenu: (event: MouseEvent) => void;
    /** A press on a cell, which starts a block; and the clipboard over the cells. */
    gridPointerdown: (event: PointerEvent) => void;
    gridCopy: (event: ClipboardEvent) => void;
    gridPaste: (event: ClipboardEvent) => void;
    /** The side bar: its tabs, the columns panel's search, boxes, select-all and dragging, the filters panel's sections. */
    sideTab: (panel: SidePanel) => void;
    /** A press on the side bar's strip beside its tabs: shuts the open panel, or opens the last one. */
    sideStrip: () => void;
    sideSearch: (text: string) => void;
    sideAll: (visible: boolean, event: Event) => void;
    sideMoveKey: (key: string, event: KeyboardEvent) => void;
    sideDragStart: (key: string, event: DragEvent) => void;
    sideDragOver: (key: string, event: DragEvent) => void;
    sideDrop: (event: DragEvent) => void;
    sideDragEnd: () => void;
    sideFilter: (key: string) => void;
    clearAllFilters: (event: Event) => void;
    /** The pivot panel: on and off, a field ticked, sent from its menu, removed, moved or dragged. */
    pivotEnable: (on: boolean) => void;
    pivotTick: (field: string, on: boolean) => void;
    pivotFieldMenu: (field: string, event: MouseEvent) => void;
    pivotRemove: (zone: PivotZone, at: number) => void;
    pivotMoveKey: (zone: PivotZone, at: number, event: KeyboardEvent) => void;
    pivotDragStart: (field: string, from: PivotZone | 'fields', event: DragEvent) => void;
    pivotDragOver: (zone: PivotZone | 'fields', before: string | null, event: DragEvent) => void;
    pivotDrop: (event: DragEvent) => void;
    pivotDragEnd: () => void;
    /** A header's info button, which opens the column's description. */
    openInfo: (column: ResolvedColumn<T>, event: MouseEvent) => void;
    /** A button of the toolbar. */
    toolbar: (key: string, event: MouseEvent) => void;
    /** The paginator's page box: the page typed, taken on Enter or when it is left. */
    pageInput: (page: number) => void;
    /** The columns drawer: its tabs, what is changed in it, and "Apply" or "Cancel". */
    drawerTab: (tab: DrawerTab, focus: boolean) => void;
    drawerToggle: (key: string, visible: boolean) => void;
    drawerAll: (visible: boolean) => void;
    drawerMoveKey: (key: string, event: KeyboardEvent) => void;
    drawerDragStart: (key: string, event: DragEvent) => void;
    drawerDragOver: (key: string, event: DragEvent) => void;
    drawerDrop: (event: DragEvent) => void;
    drawerDragEnd: () => void;
    drawerPivot: (on: boolean) => void;
    drawerGroup: (level: number, field: string | null) => void;
    drawerPivotColumn: (field: string | null) => void;
    drawerAggregate: (key: string, how: DataGridAggregate | null) => void;
    drawerSearch: (text: string) => void;
    drawerClear: () => void;
    drawerApply: () => void;
    drawerCancel: () => void;
    /** Opens or shuts the data dictionary's drawer. */
    dictionaryDrawer: (open: boolean) => void;
    /** Opens or shuts a row of a tree. */
    toggleTree: (row: T, key: string | number, event: Event) => void;
    /** A row's drag handle: dragged, or moved with Ctrl and an arrow key. */
    rowDragStart: (index: number, event: DragEvent) => void;
    rowDragOver: (event: DragEvent) => void;
    rowDrop: (event: DragEvent) => void;
    rowDragEnd: () => void;
    rowMoveKey: (index: number, event: KeyboardEvent) => void;
}

/** An icon by name, drawn the way the icon component draws it. */
export const iconView = (name: string, props?: Props): Child => iconNode(getIcon(name), props);

const named = (name: string, value: string | undefined): Props | null => (value === undefined ? null : { [name]: value });

const content = (value: Content): Child => (value === null || value === undefined ? null : value);

/** A pinned column stands still while the rest scrolls; `left` and `right` are the leading and trailing edge. */
function stickyStyle(column: ResolvedColumn): Record<string, string> | undefined {
    const at = column.sticky;
    if (!at) return undefined;
    return {
        position: 'sticky',
        [at.side === 'left' ? 'inset-inline-start' : 'inset-inline-end']: `${at.offset}px`,
        'z-index': '1'
    };
}

const pinnedState = (column: ResolvedColumn) => ({
    pinned: column.sticky?.side,
    pinnedEdge: column.sticky?.last
});

export function gridView<T>(context: ViewContext<T>): Child[] {
    const { config, part } = context;
    const rootState = {
        fillRows: !!context.fillRows,
        striped: config.stripedRows,
        gridlines: config.showGridlines,
        size: config.size,
        scrollable: config.scrollable,
        flexScroll: config.scrollHeight === 'flex',
        loading: context.busy
    };
    const paginator = config.paginator && (config.alwaysShowPaginator !== false || context.rows.total > context.models.rows);
    const tableArea = h(
            'div',
            mergeAttrs({ key: 'container' }, part('tableContainer', rootState), {
                style: {
                    ...(config.scrollable && config.scrollHeight && config.scrollHeight !== 'flex' ? { 'max-height': config.scrollHeight } : {}),
                    ...(config.minHeight ? { 'min-height': config.minHeight } : {})
                },
                onScroll: context.on.scrolled,
                ref: context.on.scroller
            }),
            h(
                'div',
                // The naming attributes are only written when there is one to
                // write: a host may have put its own on this part, and an
                // absent name must not wipe it out.
                mergeAttrs(
                    { key: 'table' },
                    named('aria-label', config.caption && !config.showCaption ? undefined : config.ariaLabel),
                    named('aria-labelledby', config.ariaLabelledby ?? (config.caption && !config.showCaption ? context.ids.caption : undefined)),
                    part('table', { sized: sized(context) }),
                    {
                        id: context.ids.table,
                        'data-grid-table': '',
                        // Moving through cells and editing them makes it an interactive grid.
                        role: tableRole(context),
                        onKeydown: context.on.gridKeydown,
                        onClick: context.on.gridClick,
                        onDblclick: context.on.gridDblclick,
                        onContextmenu: config.contextMenu ? context.on.gridContextmenu : undefined,
                        onPointerdown: config.cellSelection ? context.on.gridPointerdown : undefined,
                        onCopy: context.cellFocus ? context.on.gridCopy : undefined,
                        onPaste: context.cellFocus ? context.on.gridPaste : undefined,
                        onDragover: context.rowDrag ? context.on.rowDragOver : undefined,
                        onDrop: context.rowDrag ? context.on.rowDrop : undefined,
                        style: withSizing(
                            {
                                'grid-template-columns': tracks(context),
                                // The empty rows take what the others leave of the box's height.
                                ...(context.fillRows
                                    ? { 'grid-template-rows': [config.caption ? 'auto' : '', 'auto auto 1fr', footPresent(context) ? 'auto' : ''].filter(Boolean).join(' ') }
                                    : {})
                            },
                            config.tableStyle
                        ),
                        'aria-busy': context.busy ? 'true' : undefined,
                        // With rows or columns left out of view, the table says how many it has.
                        'aria-rowcount': context.virtual ? String(context.virtual.rowCount) : undefined,
                        'aria-colcount': config.virtualColumns ? String(context.columns.length) : undefined
                    }
                ),
                config.caption ? h('div', mergeAttrs({ key: 'caption', id: context.ids.caption }, part(config.showCaption ? 'caption' : 'hiddenCaption')), config.caption) : null,
                headView(context),
                bodyView(context),
                fillView(context),
                footView(context)
            )
        );
    return [
        headerBar(context),
        paginator && config.paginatorPosition === 'top' ? paginatorView(context) : null,
        // With a side bar, the table and the bar sit side by side; without one, the table is where it always was.
        context.sideBar ? h('div', mergeAttrs({ key: 'body-area' }, part('bodyArea', { flexScroll: rootState.flexScroll })), tableArea, sideBarView(context)) : tableArea,
        paginator && config.paginatorPosition !== 'top' ? paginatorView(context) : null,
        footerBar(context),
        statusBar(context),
        loadingMask(context),
        context.drawer ? drawerView(context, context.drawer) : null,
        context.dictionaryDrawer ? dictionaryDrawerView(context, context.dictionaryDrawer) : null,
        h(
            'div',
            mergeAttrs({ key: 'announcer' }, part('announcer'), {
                'aria-live': 'polite',
                'aria-atomic': 'true'
            }),
            context.announcement
        )
    ];
}

/**
 * The grid's column tracks, one a drawn column. A column with a width is
 * that wide; one without shares the room the way a table's columns do, never
 * narrower than its `minWidth`; a column of controls — a box, a toggle, a
 * handle, the row editor's buttons — is as wide as they are and no wider.
 * Once every column has a width, the empty filler track after them takes the
 * room they leave, so no column is stretched past the width it was given
 * (its edge would leave the pointer) and every row — its stripe, its rule —
 * still runs to the grid's edge, as in a spreadsheet.
 */
function tracks<T>(context: ViewContext<T>): string {
    const list = context.drawn.map((entry) => (isSpacer(entry) ? `${entry.width}px` : track(entry)));
    if (sized(context)) {
        const at = fillerAt(context);
        list.splice(at < 0 ? list.length : at, 0, 'minmax(0, 1fr)');
    }
    return list.length ? list.join(' ') : '1fr';
}

function track<T>(column: ResolvedColumn<T>): string {
    // Never less than nothing: a value the browser refused would leave every track as it was.
    if (column.width) return `${Math.max(0, column.width)}px`;
    const own = column.column;
    if (column.selectionMode || own.expander || own.rowEditor || own.rowDrag || own.rowNumber) return 'max-content';
    // A flex column takes its share of the room the others leave, as fr tracks share it.
    if (own.flex) return `minmax(${own.minWidth ?? 0}px, ${own.flex}fr)`;
    return own.minWidth ? `minmax(${own.minWidth}px, auto)` : 'auto';
}

/** What the grid is to assistive technology: a tree, a grid the keyboard moves through and edits, or a table to read. */
const roles = new WeakMap<object, 'table' | 'grid' | 'treegrid'>();
function tableRole<T>(context: ViewContext<T>): 'table' | 'grid' | 'treegrid' {
    let role = roles.get(context);
    if (!role) {
        role = context.lines.some((line) => line.kind === 'row' && line.tree) ? 'treegrid' : context.cellFocus ? 'grid' : 'table';
        roles.set(context, role);
    }
    return role;
}

/** A cell's role: a grid's cells are `gridcell`, a table's `cell`. */
const cellRole = <T>(context: ViewContext<T>) => (tableRole(context) === 'table' ? 'cell' : 'gridcell');

/** A cell across the whole row: every track, and said to span every column. */
const spanAll = <T>(context: ViewContext<T>) => ({ style: { 'grid-column': '1 / -1' }, 'aria-colspan': span(context) });

/**
 * Whether the columns are laid out by their widths alone (see `sizedTable`):
 * once a resizable grid has every width, and always in a grid that draws its
 * columns as they come into view, where a left-out column is a spacer of its width.
 */
function sized<T>(context: ViewContext<T>): boolean {
    const { config, columns } = context;
    return (!!config.resizableColumns || !!config.virtualColumns) && !!columns.length && columns.every((column) => column.width);
}

/**
 * The empty cell in the filler track, while the widths lay the table out.
 * Nothing to read in it, so it is hidden from assistive technology.
 */
type CellLook = 'headerCell' | 'filterCell' | 'bodyCell' | 'footerCell';

function filler<T>(context: ViewContext<T>, look: CellLook): VElement[] {
    if (!sized(context)) return [];
    // Dressed as the row's other cells (ground, rules, stripes), emptied of padding.
    return [
        h(
            'div',
            mergeAttrs(
                {
                    key: '__filler',
                    'aria-hidden': 'true'
                },
                context.part(look, {}),
                context.part('fillerCell')
            )
        )
    ];
}

/** Where the filler goes among a row's drawn columns: before the first pinned to the end, or else last. */
const fillerAt = <T>(context: ViewContext<T>) => context.drawn.findIndex((entry) => !isSpacer(entry) && entry.sticky?.side === 'right');

/**
 * A row's cells with the filler among them: before the columns pinned to the
 * end, which stay at the grid's edge (row actions, say), or else last.
 */
function withFiller<T>(context: ViewContext<T>, cells: Child[], look: CellLook, at = fillerAt(context)): Child[] {
    const extra = filler(context, look);
    if (!extra.length) return cells;
    return at < 0 ? [...cells, ...extra] : [...cells.slice(0, at), ...extra, ...cells.slice(at)];
}

/** The empty cell that keeps the room of the columns left out of view. */
function spacerCell<T>(context: ViewContext<T>, spacer: ColumnSpacer, look: CellLook): VElement {
    return h('div', mergeAttrs({ key: spacer.key, 'aria-hidden': 'true' }, context.part(look, {}), context.part('fillerCell')));
}

/** One row's cells, column by column, with the spacers and the filler where they go. */
function cells<T>(context: ViewContext<T>, look: CellLook, draw: (column: ResolvedColumn<T>) => Child): Child[] {
    return withFiller(
        context,
        context.drawn.map((entry) => (isSpacer(entry) ? spacerCell(context, entry, look) : draw(entry))),
        look
    );
}

/** Where a cell stands among all the columns, said only when some are left out of view. */
const colIndex = <T>(context: ViewContext<T>, column: ResolvedColumn<T>) => (context.config.virtualColumns ? String(column.position) : undefined);

/** How many columns a cell spanning the row covers, for a reader: the drawn ones, which a spacer stands in for. */
const span = <T>(context: ViewContext<T>) => String(Math.max(1, context.config.virtualColumns ? context.columns.length : context.drawn.length));

/** The sizing under the host's own table style, which wins — as text or as an object. */
function withSizing(sizing: Record<string, string>, own: string | Record<string, string> | undefined): string | Record<string, string> | undefined {
    if (!Object.keys(sizing).length) return own;
    if (typeof own === 'string') return `${Object.entries(sizing).map(([key, value]) => `${key}: ${value}`).join('; ')}; ${own}`;
    return { ...sizing, ...own };
}

/** The bar below the table, when the host draws one. */
function footerBar<T>(context: ViewContext<T>): Child {
    const own = content(context.config.content?.footer?.());
    return own === null ? null : h('div', mergeAttrs({ key: 'footer' }, context.part('footer')), own);
}

/** The bar that counts the rows: what the host's function draws, or the counts in words. */
function statusBar<T>(context: ViewContext<T>): Child {
    const status = context.status;
    if (!status) return null;
    const { config, part, locale } = context;
    const words = locale.datagrid;
    const number = (n: number, digits = 0) => n.toLocaleString(locale.code, { maximumFractionDigits: digits });
    const own = typeof config.statusBar === 'function' ? content(config.statusBar(status)) : null;
    const items: [string, string][] = [];
    if (own === null) {
        items.push(['rows', formatMessage(status.filtered === status.total ? words.statusRows : words.statusFiltered, { count: number(status.filtered), total: number(status.total) })]);
        if (status.selected) items.push(['selected', formatMessage(words.statusSelected, { count: number(status.selected) })]);
        const range = status.range;
        if (range && range.count > 1) {
            items.push(['count', formatMessage(words.statusCount, { count: number(range.count) })]);
            if (range.numbers) {
                items.push(['sum', formatMessage(words.statusSum, { value: number(range.sum, 2) })]);
                items.push(['avg', formatMessage(words.statusAvg, { value: number(range.avg, 2) })]);
                items.push(['min', formatMessage(words.statusMin, { value: number(range.min, 2) })]);
                items.push(['max', formatMessage(words.statusMax, { value: number(range.max, 2) })]);
            }
        }
    }
    return h(
        'div',
        mergeAttrs({ key: 'status' }, part('statusBar'), { role: 'status', 'aria-live': 'polite' }),
        own ?? items.map(([key, text]) => h('span', mergeAttrs({ key }, part('statusItem', { kind: key })), text))
    );
}

/** Whether the table waits as placeholder rows rather than under the mask. */
const skeletonShown = <T,>(context: ViewContext<T>) => context.busy && context.config.loadingMode === 'skeleton';

/** Over the table while it waits, named for a reader who cannot see it turn. */
function loadingMask<T>(context: ViewContext<T>): Child {
    if (!context.busy) return null;
    const { part, locale } = context;
    // The placeholder rows are hidden from assistive technology, so the wait is
    // still said, with nothing drawn over them.
    if (skeletonShown(context)) return h('div', mergeAttrs({ key: 'loading' }, part('loadingText'), { role: 'status' }), locale.loading);
    return h(
        'div',
        mergeAttrs({ key: 'loading' }, part('loadingMask'), { role: 'status' }),
        content(context.config.content?.loadingIcon?.()) ?? iconView('spinner', mergeAttrs(part('loadingIcon'), { class: 'vt-icon-spin' })),
        h('span', part('loadingText'), locale.loading)
    );
}

/** The bar above the table: the host's own header, and the button the column list hangs from. */
function headerBar<T>(context: ViewContext<T>): Child {
    const { config, part, locale } = context;
    const own = content(config.content?.header?.());
    const tools = context.toolbar ?? [];
    if (!config.columnToggle && own === null && !tools.length) return null;
    return h(
        'div',
        mergeAttrs({ key: 'header' }, part('header')),
        own,
        tools.length
            ? h(
                  'div',
                  mergeAttrs({ key: 'toolbar' }, part('toolbar'), { role: 'toolbar', 'aria-label': locale.datagrid.toolbar }),
                  tools.map((tool) =>
                      h(
                          'button',
                          mergeAttrs({ key: tool.key, type: 'button' }, part('toolbarButton', { labelled: tool.showLabel, pressed: tool.pressed }), {
                              'aria-label': tool.showLabel ? undefined : tool.label,
                              'aria-pressed': tool.pressed === undefined ? undefined : String(tool.pressed),
                              'aria-haspopup': tool.popup,
                              'data-toolbar': tool.key,
                              ref: (element: Element | null) => context.on.tip(element, tool.showLabel ? undefined : tool.label),
                              onClick: (event: MouseEvent) => context.on.toolbar(tool.key, event)
                          }),
                          tool.icon ? iconView(tool.icon, part('toolbarIcon')) : null,
                          tool.showLabel ? h('span', null, tool.label) : null
                      )
                  )
              )
            : null,
        !config.columnToggle
            ? null
            : h(
                  'button',
                  mergeAttrs({ key: 'chooser-button', type: 'button' }, part('chooserButton'), {
                      'aria-expanded': context.chooser.open ? 'true' : 'false',
                      'aria-controls': context.ids.list,
                      ref: context.on.chooserButton,
                      onClick: context.on.toggleChooser
                  }),
                  iconView('sliders'),
                  h('span', null, locale.aria.chooseColumns)
              )
    );
}

/**
 * The column list itself, which the handle puts in an overlay anchored to that
 * button — so a long list is not cut off by the table it hangs over.
 */
export function chooserView<T>(context: ViewContext<T>): VElement {
    const { part, locale } = context;
    return h(
        'div',
        mergeAttrs({ id: context.ids.list }, part('chooserPanel'), {
            role: 'group',
            'aria-label': locale.aria.columns,
            ref: context.on.chooserScroller
        }),
        h(
            'ul',
            part('chooserList'),
            context.chooser.columns.map((entry) =>
                h(
                    'li',
                    mergeAttrs({ key: entry.key }, part('chooserItem')),
                    h(
                        'label',
                        part('chooserLabel'),
                        h(
                            'input',
                            mergeAttrs({ type: 'checkbox' }, part('chooserCheckbox'), {
                                checked: entry.visible,
                                disabled: entry.visible && entry.last,
                                onChange: (event: Event) => context.on.setVisible(entry.key, (event.target as HTMLInputElement).checked, event)
                            })
                        ),
                        h('span', null, entry.header)
                    )
                )
            )
        )
    ) as VElement;
}

const rowFilters = (config: ViewContext['config']) => config.filterDisplay === 'row' || config.filterDisplay === 'both';

function headView<T>(context: ViewContext<T>): Child {
    const { columns, config, part, locale, filters } = context;
    const filterRow = rowFilters(config) && columns.some((column) => isFilterable(column, filters));
    const depth = groupDepth(columns);

    return h(
        'div',
        // On the head rather than a row: with groups, the columns' own headers are in several rows.
        mergeAttrs({ key: 'thead', role: 'rowgroup', 'data-section': 'head' }, part('thead'), {
            onDragover: context.on.dragOver,
            onDrop: context.on.drop
        }),
        depth
            ? groupedHeaderRows(context, depth)
            : h(
                  'div',
                  mergeAttrs({ key: 'header-row', role: 'row' }, part('headerRow'), {
                      'aria-rowindex': headerRowIndex(context, 0)
                  }),
                  cells(context, 'headerCell', (column) => headerCell(context, column))
              ),
        filterRow
            ? h(
                  'div',
                  mergeAttrs({ key: 'filter-row', role: 'row' }, part('filterRow'), {
                      'aria-rowindex': headerRowIndex(context, depth + 1)
                  }),
                  cells(context, 'filterCell', (column) =>
                      h(
                          'div',
                          mergeAttrs(
                              { key: column.key, role: cellRole(context) },
                              part('filterCell', {
                                  align: column.align,
                                  ...pinnedState(column)
                              }),
                              {
                                  style: stickyStyle(column),
                                  'aria-colindex': colIndex(context, column)
                              }
                          ),
                          isFilterable(column, filters)
                              ? (content(
                                    column.column.filterContent?.({
                                        column: column.column,
                                        value: filterValue(filters, column),
                                        setValue: (value: unknown) => context.on.setFilter(column, value)
                                    })
                                ) ??
                                    h(
                                        'span',
                                        part('filterField'),
                                        h(
                                            'input',
                                            mergeAttrs({ type: 'search' }, part('filterInput'), {
                                                value: filterText(filters, column),
                                                placeholder: column.column.filterPlaceholder,
                                                'aria-label': formatMessage(locale.aria.filterColumn, { column: column.header }),
                                                onInput: (event: Event) => context.on.setFilter(column, (event.target as HTMLInputElement).value)
                                            })
                                        )
                                    ))
                              : null
                      )
                  )
              )
            : null,
        context.pinnedTop.map((row, index) => pinnedRowView(context, row, index, 'top'))
    );
}

/** How many rows the head has: the headings, the filter boxes, the rows pinned to the top. */
function headRowCount<T>(context: ViewContext<T>): number {
    const { columns, config, filters } = context;
    const filterRow = rowFilters(config) && columns.some((column) => isFilterable(column, filters));
    return Math.max(1, groupDepth(columns) + 1) + (filterRow ? 1 : 0) + context.pinnedTop.length;
}

/** A head row's `aria-rowindex`, written only when rows are left out of view. */
const headerRowIndex = <T>(context: ViewContext<T>, row: number) => (context.virtual ? String(row + 1) : undefined);

/** One column's own header: its title, its sort, its select-all, its resize handle. */
function headerCell<T>(context: ViewContext<T>, column: ResolvedColumn<T>): VElement {
    const { config, part, locale } = context;
    const sortIndex = context.sorts.findIndex((sort) => sort.field === column.sortField);
    const sortMeta = context.sorts[sortIndex];
    const sortIcon = !sortMeta ? 'sort' : sortMeta.order === 1 ? 'arrowUp' : 'arrowDown';
    // ARIA asks for aria-sort on one header at a time: the primary sort.
    const primary = context.sorts[0];
    const ariaSort = column.column.sortable && primary && primary.field === column.sortField ? (primary.order === 1 ? 'ascending' : 'descending') : undefined;
    // A selection column holds a control, not a value, so there is nothing to
    // widen it for — and nothing to name its handle after.
    const canResize = !!config.resizableColumns && column.column.resizable !== false && !column.selectionMode;
    const canReorder = !!config.reorderableColumns && !column.selectionMode;
    const title = () => h('span', part('headerTitle'), content(column.column.headerContent?.({ column: column.column })) ?? column.header);
    // Right after the title, one thing: the arrow while the column is sorted, else its info button when it has one.
    const sorted = sortIndex >= 0;
    const info = context.menus.info && hasDescription(column.column);
    const tools = headerTools(context, column, info && !sorted);
    // With buttons beside it, the title and the buttons share one line; a press on the room left over sorts, as the title does.
    const withTools = (main: Child) =>
        tools
            ? h(
                  'span',
                  mergeAttrs(part('headerContent'), {
                      onClick: column.column.sortable
                          ? (event: MouseEvent) => {
                                if (event.target === event.currentTarget) (event.currentTarget as HTMLElement).querySelector<HTMLButtonElement>('button')?.click();
                            }
                          : undefined
                  }),
                  main,
                  tools
              )
            : main;
    return h(
        'div',
        mergeAttrs(
            {
                key: column.key,
                role: 'columnheader'
            },
            part('headerCell', {
                toolsAtTitle: (column.column.headerToolsAt ?? config.headerToolsAt) === 'title',
                sortable: column.column.sortable,
                sorted: sortIndex >= 0,
                align: column.align,
                ...pinnedState(column),
                dragging: context.dragging === column.key,
                dropping: context.dropOn === column.key
            }),
            {
                'data-column': column.key,
                'aria-sort': ariaSort,
                'aria-colindex': colIndex(context, column),
                draggable: canReorder ? 'true' : undefined,
                style: {
                    ...stickyStyle(column),
                    ...column.column.headerStyle
                },
                class: column.column.headerClass,
                onDragstart: (event: DragEvent) => context.on.dragStart(column, event),
                onDragend: context.on.dragEnd,
                onKeydown: (event: KeyboardEvent) => context.on.headerKeydown(column, event)
            }
        ),
        column.selectionMode === 'multiple'
            ? h(
                  'span',
                  part('checkbox'),
                  h(
                      'input',
                      mergeAttrs({ type: 'checkbox' }, part('checkboxInput'), {
                          checked: context.allState === 'all',
                          'aria-label': locale.aria.selectAll,
                          ref: (el: Element) => ((el as HTMLInputElement).indeterminate = context.allState === 'some'),
                          onChange: context.on.toggleAll
                      })
                  ),
                  context.allState !== 'none' ? iconView(context.allState === 'all' ? 'check' : 'minus', part('checkboxIcon')) : null
              )
            : column.selectionMode
              ? h('span', part('selectionHeaderText'), locale.aria.selectRow)
              : (column.column.expander || column.column.rowEditor) && !column.header
                ? // A column of buttons still needs a name for the header a screen reader reads out.
                  h('span', { class: 'vt-sr-only' }, column.column.rowEditor ? locale.datagrid.editRow : locale.aria.rowDetails)
                : column.column.sortable
                  ? withTools(
                        h(
                            'button',
                            mergeAttrs({ type: 'button' }, part('sortButton'), {
                                onClick: (event: MouseEvent) => context.on.sort(column, event)
                            }),
                            title(),
                            sorted || !info ? h('span', mergeAttrs(part('sortIcon', { active: sorted })), iconView(sortIcon)) : null,
                            config.sortMode === 'multiple' && context.sorts.length > 1 && sortIndex >= 0
                                ? h(
                                      'span',
                                      mergeAttrs(part('sortBadge'), {
                                          'aria-hidden': 'true'
                                      }),
                                      String(sortIndex + 1)
                                  )
                                : null,
                            sortIndex > 0 ? h('span', part('sortStatus'), sortMeta!.order === 1 ? locale.aria.sortAscending : locale.aria.sortDescending) : null
                        )
                    )
                  : withTools(title()),
        canResize
            ? h(
                  'span',
                  mergeAttrs(
                      {
                          role: 'separator',
                          tabindex: '0',
                          'aria-orientation': 'vertical'
                      },
                      part('resizer', { resizing: context.resizing === column.key }),
                      {
                          'aria-label': formatMessage(locale.aria.resizeColumn, {
                              column: column.header
                          }),
                          // What a drag would start from, which is what the engine resizes from too.
                          'aria-valuenow': String(Math.round(column.width ?? column.column.minWidth ?? MIN_COLUMN_WIDTH)),
                          'aria-valuemin': String(column.column.minWidth ?? MIN_COLUMN_WIDTH),
                          onPointerdown: (event: PointerEvent) => context.on.resizeStart(column, event),
                          onKeydown: (event: KeyboardEvent) => context.on.resizeKey(column, event),
                          onDblclick: (event: Event) => context.on.pin(column, column.sticky ? null : 'left', event)
                      }
                  )
              )
            : null
    );
}

/** Whether a column filters from a panel its header opens. */
export const filtersByMenu = <T>(config: ViewContext<T>['config'], column: ResolvedColumn<T>): boolean =>
    (config.filterDisplay === 'menu' || config.filterDisplay === 'both') && !column.selectionMode && !!column.filterField && !!column.column.filter;

/** Whether a column offers its menu. */
export const offersMenu = <T>(config: ViewContext<T>['config'], column: ResolvedColumn<T>): boolean =>
    !!config.columnMenu && column.column.menu !== false && !column.selectionMode && !column.column.expander && !column.column.rowEditor;

/** A header's buttons besides its title: the filter panel's, lit while the column is filtered, and the menu's. */
function headerTools<T>(context: ViewContext<T>, column: ResolvedColumn<T>, info: boolean): Child {
    const { config, part, locale, menus } = context;
    const filter = menus.filter && filtersByMenu(config, column);
    const menu = menus.column && offersMenu(config, column);
    if (!filter && !menu && !info) return null;
    const active = filter && hasFilter(context.filters, column);
    const open = menus.open === column.key;
    // The filter and the menu, which act on the column, go together; the info button goes by the title it explains, or with them.
    const infoButton = info
        ? h(
              'button',
              mergeAttrs({ type: 'button' }, part('headerToolButton', { kind: 'info', open: menus.infoOpen === column.key }), {
                  'aria-label': formatMessage(locale.datagrid.columnInfo, { column: column.header }),
                  'aria-haspopup': 'dialog',
                  'aria-expanded': String(menus.infoOpen === column.key),
                  'data-info-button': column.key,
                  ref: (element: Element | null) => context.on.tip(element, formatMessage(locale.datagrid.columnInfo, { column: column.header })),
                  onClick: (event: MouseEvent) => context.on.openInfo(column, event)
              }),
              iconView('info')
          )
        : null;
    const infoWithTools = (column.column.headerInfoAt ?? config.headerInfoAt) === 'edge';
    if (!filter && !menu && !infoWithTools) return infoButton;
    const group = h(
        'span',
        part('headerTools'),
        infoWithTools ? infoButton : null,
        filter
            ? h(
                  'button',
                  mergeAttrs(
                      { type: 'button' },
                      part('headerToolButton', {
                          kind: 'filter',
                          active,
                          open: open && !!context.filterPanel
                      }),
                      {
                          'aria-label': formatMessage(locale.aria.filterColumn, {
                              column: column.header
                          }),
                          'aria-haspopup': 'dialog',
                          'aria-expanded': String(open && !!context.filterPanel),
                          'aria-pressed': undefined,
                          'data-filter-button': column.key,
                          ref: (element: Element | null) => context.on.tip(element, formatMessage(locale.aria.filterColumn, { column: column.header })),
                          onClick: (event: MouseEvent) => context.on.openFilter(column, event)
                      }
                  ),
                  iconView('filter')
              )
            : null,
        menu
            ? h(
                  'button',
                  mergeAttrs(
                      { type: 'button' },
                      part('headerToolButton', {
                          kind: 'menu',
                          open: open && !context.filterPanel
                      }),
                      {
                          'aria-label': formatMessage(locale.datagrid.columnMenu, {
                              column: column.header
                          }),
                          'aria-haspopup': 'menu',
                          'aria-expanded': String(open && !context.filterPanel),
                          'data-menu-button': column.key,
                          ref: (element: Element | null) => context.on.tip(element, formatMessage(locale.datagrid.columnMenu, { column: column.header })),
                          onClick: (event: MouseEvent) => context.on.openColumnMenu(column, event)
                      }
                  ),
                  iconView('moreVertical')
              )
            : null
    );
    return infoButton && !infoWithTools ? [infoButton, group] : group;
}

/** Whether a column says what it holds, which its header and the data dictionary show. */
export const hasDescription = <T>(column: DataGridColumn<T>): boolean =>
    !!(column.description || column.formula || column.descriptionContent || column.source || column.notes?.length || column.kind);

/** A column's own account of itself, for its info button or the data dictionary. */
export const columnAbout = <T>(column: DataGridColumn<T>, place: 'info' | 'dictionary'): ColumnAbout => ({
    description: column.descriptionContent?.({ column, place }) ?? column.description ?? null,
    formula: column.formula,
    kind: column.kind,
    source: column.source,
    notes: column.notes === undefined ? undefined : ([] as string[]).concat(column.notes).filter(Boolean)
});

/** A column's kind as a tag: a dimension says what a row is about, a metric measures it. */
const kindTag = <T>(context: ViewContext<T>, kind: 'dimension' | 'metric' | undefined): Child =>
    kind ? h('span', context.part('columnKind', { kind }), kind === 'metric' ? context.locale.datagrid.metric : context.locale.datagrid.dimension) : null;

/** What a column holds and how it is worked out, as its info button and the data dictionary show them. */
function aboutColumn<T>(context: ViewContext<T>, about: ColumnAbout): Child[] {
    const { part, locale } = context;
    const words = locale.datagrid;
    const { description, formula, source, notes } = about;
    return [
        h('div', mergeAttrs({ key: 'description' }, part('columnDescription')), content(description) ?? h('span', part('columnNoDescription'), words.noDescription)),
        source ? h('div', mergeAttrs({ key: 'source' }, part('columnSource')), formatMessage(words.source, { source })) : null,
        notes?.length
            ? h(
                  'div',
                  mergeAttrs({ key: 'notes' }, part('columnNotes'), { role: 'note', 'aria-label': words.notes }),
                  iconView('warning'),
                  notes.length === 1 ? h('p', null, notes[0]) : h('ul', null, notes.map((note, at) => h('li', { key: at }, note)))
              )
            : null,
        formula
            ? h(
                  'div',
                  mergeAttrs({ key: 'formula' }, part('columnFormula')),
                  h('span', part('columnFormulaLabel'), words.formula),
                  h('code', part('columnFormulaText'), formula)
              )
            : null
    ];
}

/** The popover a header's info button opens: the column's name, what it holds, how it is worked out. */
export function columnInfoView<T>(context: ViewContext<T>, column: ResolvedColumn<T>): VElement {
    const { part, locale } = context;
    const titleId = `${context.ids.table}-info-title`;
    return h(
        'div',
        mergeAttrs({ id: `${context.ids.table}-info` }, part('columnInfo'), { role: 'dialog', 'aria-labelledby': titleId }),
        h(
            'div',
            part('columnInfoHeading'),
            h('h3', mergeAttrs(part('columnInfoTitle'), { id: titleId }), column.header || formatMessage(locale.datagrid.columnInfo, { column: column.key })),
            kindTag(context, column.column.kind)
        ),
        aboutColumn(context, columnAbout(column.column, 'info'))
    ) as VElement;
}

const hasFilter = (filters: FilterMeta, column: ResolvedColumn): boolean => {
    const filter = filters[column.filterField];
    if (!filter) return false;
    const values = 'constraints' in filter ? filter.constraints.map((c) => c.value) : [filter.value];
    // A list filter with every value ticked is still a filter; one that is null is not.
    return values.some((value) => value !== null && value !== undefined && value !== '');
};

/**
 * A column's filter panel: for conditions, how each compares and the value it
 * compares with, joined by And or Or; for a list, a search over the column's
 * values, select-all, and a box for each. Either way, a Clear at the end.
 */
export function filterPanelView<T>(context: ViewContext<T>, inline = false): VElement | null {
    const view = context.filterPanel;
    if (!view) return null;
    const { part, locale } = context;
    const words = locale.datagrid;
    const field = (at: 0 | 1) =>
        h(
            'div',
            mergeAttrs({ key: `condition-${at}` }, part('filterCondition')),
            view.modes[at] ?? null,
            h(
                'span',
                part('filterField'),
                h(
                    'input',
                    mergeAttrs(
                        {
                            type: view.kind === 'date' ? 'date' : 'text',
                            inputmode: view.kind === 'number' ? 'decimal' : undefined
                        },
                        part('filterInput'),
                        {
                            value: view.texts[at],
                            'aria-label': `${words.filterValue} ${at + 1}`,
                            'data-filter-value': String(at),
                            onInput: (event: Event) => context.on.filterText(at, (event.target as HTMLInputElement).value)
                        }
                    )
                )
            )
        );
    const operator = h(
        'div',
        mergeAttrs({ key: 'operator' }, part('filterOperator'), {
            role: 'radiogroup',
            'aria-label': `${words.and} / ${words.or}`
        }),
        (['and', 'or'] as const).map((value) =>
            h(
                'label',
                mergeAttrs({ key: value }, part('filterOperatorOption')),
                h('input', {
                    type: 'radio',
                    name: `${context.ids.table}-operator`,
                    value,
                    checked: view.operator === value,
                    onChange: () => context.on.filterOperator(value)
                }),
                h('span', null, value === 'and' ? words.and : words.or)
            )
        )
    );
    const conditions = [field(0), ...(view.texts[0].trim() || view.texts[1].trim() ? [operator, field(1)] : [])];
    const list = [
        h(
            'span',
            mergeAttrs({ key: 'search' }, part('filterField')),
            h(
                'input',
                mergeAttrs({ type: 'search' }, part('filterInput'), {
                    value: view.search,
                    'aria-label': words.searchValues,
                    placeholder: words.searchValues,
                    'data-filter-search': '',
                    onInput: (event: Event) => context.on.filterSearch((event.target as HTMLInputElement).value)
                })
            )
        ),
        h(
            'label',
            mergeAttrs({ key: 'all' }, part('filterValue', { all: true })),
            h('input', {
                type: 'checkbox',
                checked: view.all === 'all',
                ref: (el: Element) => ((el as HTMLInputElement).indeterminate = view.all === 'some'),
                onChange: (event: Event) => context.on.filterAll((event.target as HTMLInputElement).checked)
            }),
            h('span', null, words.selectAll)
        ),
        h(
            'ul',
            mergeAttrs({ key: 'values' }, part('filterValues'), {
                'aria-label': context.filterPanel!.header
            }),
            view.values.map((entry, index) =>
                h(
                    'li',
                    { key: `${index}:${entry.label}` },
                    h(
                        'label',
                        part('filterValue'),
                        h('input', {
                            type: 'checkbox',
                            checked: entry.checked,
                            onChange: (event: Event) => context.on.filterTick(index, (event.target as HTMLInputElement).checked),
                            // Named by its label even when the host draws something else beside the box.
                            'aria-label': entry.content === undefined || entry.content === null ? undefined : entry.label
                        }),
                        h('span', null, content(entry.content ?? null) ?? entry.label)
                    )
                )
            )
        ),
        view.more > 0 ? h('p', mergeAttrs({ key: 'more' }, part('filterMore')), formatMessage(words.moreValues, { count: view.more })) : null
    ];
    return h(
        'div',
        mergeAttrs({ id: `${context.ids.table}-filter-panel${inline ? '-inline' : ''}` }, part('filterPanel', { kind: view.kind, inline }), {
            role: inline ? 'group' : 'dialog',
            'aria-label': formatMessage(locale.aria.filterColumn, {
                column: view.header
            })
        }),
        h('div', part('filterPanelBody'), view.kind === 'set' ? list : conditions),
        h(
            'div',
            part('filterPanelFooter'),
            h(
                'button',
                mergeAttrs({ type: 'button' }, part('filterClear'), {
                    onClick: () => context.on.clearFilter()
                }),
                iconView('close'),
                h('span', null, words.clearFilter)
            )
        )
    ) as VElement;
}


/**
 * The side bar: a tab for each panel down its edge, and the panel open
 * beside them — the columns, to show, hide and put in order, or each
 * column's filter, one open at a time.
 */
function sideBarView<T>(context: ViewContext<T>): VElement {
    const { part, locale } = context;
    const side = context.sideBar!;
    const words = locale.datagrid;
    const panelId = (panel: SidePanel) => `${context.ids.table}-side-${panel}`;
    const panelName = (panel: SidePanel) =>
        panel === 'columns' ? words.columnsPanel : panel === 'pivot' ? words.pivotPanel : panel === 'dictionary' ? words.dictionaryPanel : words.filtersPanel;
    const panelIcon = (panel: SidePanel) => (panel === 'columns' ? 'columns' : panel === 'pivot' ? 'table' : panel === 'dictionary' ? 'bookOpen' : 'filter');
    const tabs = h(
        'div',
        mergeAttrs(part('sideTabs'), {
            role: 'toolbar',
            'aria-orientation': 'vertical',
            'aria-label': words.sideBar,
            // The whole strip is a target, down the table's height: a press beside the tabs opens or shuts the panel.
            onClick: (event: MouseEvent) => {
                if (event.target === event.currentTarget) context.on.sideStrip();
            }
        }),
        side.panels.map((panel) =>
            h(
                'button',
                mergeAttrs({ key: panel, type: 'button' }, part('sideTab', { open: side.open === panel }), {
                    'aria-pressed': String(side.open === panel),
                    'aria-controls': side.open === panel ? panelId(panel) : undefined,
                    'data-side-tab': panel,
                    onClick: () => context.on.sideTab(panel)
                }),
                iconView(panelIcon(panel), part('sideTabIcon')),
                h('span', part('sideTabLabel'), panelName(panel))
            )
        )
    );
    const columnsPanel = () => {
        const search = side.search.trim().toLocaleLowerCase(locale.code);
        const shown = side.columns.filter((entry) => !search || entry.header.toLocaleLowerCase(locale.code).includes(search));
        const visible = side.columns.filter((entry) => entry.visible).length;
        return [
            // The search and the tick for all of them stay at the top while the list scrolls under them.
            h(
                'div',
                mergeAttrs({ key: 'head' }, part('sidePanelHead')),
                h(
                    'span',
                    mergeAttrs({ key: 'search' }, part('filterField')),
                    h(
                        'input',
                        mergeAttrs({ type: 'search' }, part('filterInput'), {
                            value: side.search,
                            placeholder: words.searchColumns,
                            'aria-label': words.searchColumns,
                            'data-side-search': '',
                            onInput: (event: Event) => context.on.sideSearch((event.target as HTMLInputElement).value)
                        })
                    )
                ),
                h(
                    'label',
                    mergeAttrs({ key: 'all' }, part('filterValue', { all: true })),
                    h('input', {
                        type: 'checkbox',
                        checked: visible === side.columns.length,
                        ref: (el: Element) => ((el as HTMLInputElement).indeterminate = visible > 0 && visible < side.columns.length),
                        onChange: (event: Event) => context.on.sideAll((event.target as HTMLInputElement).checked, event)
                    }),
                    h('span', null, words.selectAll)
                )
            ),
            h(
                'ul',
                mergeAttrs({ key: 'list' }, part('sideColumns'), { 'aria-label': words.columnsPanel }),
                shown.map((entry) =>
                    h(
                        'li',
                        mergeAttrs({ key: entry.key }, part('sideColumn', { dragging: side.dragging === entry.key, dropping: side.dropOn === entry.key }), {
                            'data-side-column': entry.key,
                            onDragover: (event: DragEvent) => context.on.sideDragOver(entry.key, event),
                            onDrop: context.on.sideDrop
                        }),
                        h(
                            'span',
                            mergeAttrs(part('sideColumnHandle'), {
                                role: 'button',
                                tabindex: '0',
                                draggable: 'true',
                                'aria-label': formatMessage(words.moveColumn, { column: entry.header }),
                                'aria-roledescription': words.dragHandle,
                                onDragstart: (event: DragEvent) => context.on.sideDragStart(entry.key, event),
                                onDragend: context.on.sideDragEnd,
                                onKeydown: (event: KeyboardEvent) => context.on.sideMoveKey(entry.key, event)
                            }),
                            iconView('grip')
                        ),
                        h(
                            'label',
                            part('filterValue'),
                            h('input', {
                                type: 'checkbox',
                                checked: entry.visible,
                                disabled: entry.visible && entry.last,
                                onChange: (event: Event) => context.on.setVisible(entry.key, (event.target as HTMLInputElement).checked, event)
                            }),
                            h('span', null, entry.header)
                        )
                    )
                )
            )
        ];
    };
    const dictionaryPanel = () => dictionaryBody(context, { entries: side.dictionary ?? [], module: side.dictionaryModule, subtitle: side.dictionarySubtitle, search: side.search });
    const filtersPanel = () =>
        side.filters.length
            ? [
                  ...side.filters.map((entry) => {
                      const sectionId = `${panelId('filters')}-${entry.key.replace(/[^\w-]/g, '_')}`;
                      return h(
                          'div',
                          mergeAttrs({ key: entry.key }, part('sideFilter', { open: entry.open, active: entry.active })),
                          h(
                              'button',
                              mergeAttrs({ type: 'button' }, part('sideFilterToggle', { open: entry.open, active: entry.active }), {
                                  'aria-expanded': String(entry.open),
                                  'aria-controls': entry.open ? sectionId : undefined,
                                  'data-side-filter': entry.key,
                                  onClick: () => context.on.sideFilter(entry.key)
                              }),
                              iconView('chevronRight', part('sideFilterIcon', { open: entry.open })),
                              h('span', part('sideFilterLabel'), entry.header),
                              entry.active ? iconView('filter', part('sideFilterActive')) : null
                          ),
                          entry.open ? h('div', { id: sectionId }, filterPanelView(context, true)) : null
                      );
                  }),
                  h(
                      'div',
                      mergeAttrs({ key: 'clear-all' }, part('filterPanelFooter')),
                      h(
                          'button',
                          mergeAttrs({ type: 'button' }, part('filterClear'), {
                              disabled: !side.filters.some((entry) => entry.active),
                              onClick: (event: Event) => context.on.clearAllFilters(event)
                          }),
                          iconView('close'),
                          h('span', null, words.clearAllFilters)
                      )
                  )
              ]
            : [h('p', mergeAttrs({ key: 'none' }, part('filterMore')), words.noFilters)];
    return h(
        'aside',
        mergeAttrs({ key: 'side-bar' }, part('sideBar', { open: !!side.open }), { 'aria-label': words.sideBar }),
        side.open
            ? h(
                  'div',
                  mergeAttrs({ key: side.open, id: panelId(side.open) }, part('sidePanel', { panel: side.open }), {
                      role: 'region',
                      'aria-label': panelName(side.open)
                  }),
                  side.open === 'columns'
                      ? columnsPanel()
                      : side.open === 'pivot'
                        ? side.pivot
                            ? pivotPanelView(context, side.pivot)
                            : null
                        : side.open === 'dictionary'
                          ? dictionaryPanel()
                          : filtersPanel()
              )
            : null,
        tabs
    ) as VElement;
}

/**
 * The side bar's pivot panel: a switch that turns the pivot on and off, the
 * three places a field can go — down the side, across the top, worked out in
 * the cells — and the fields to take them from. A field is dragged into a
 * place or within one, ticked to put it where its kind suggests, or sent to
 * a place from its menu; in a place, Ctrl and an arrow move it.
 */
function pivotPanelView<T>(context: ViewContext<T>, view: PivotPanelView): Child[] {
    const { part, locale } = context;
    const words = locale.datagrid;
    const zoneName = (zone: PivotZone) => (zone === 'rows' ? words.pivotRows : zone === 'columns' ? words.pivotColumns : words.pivotValues);
    const dropping = (zone: PivotZone | 'fields', before: string | null) => view.dropZone === zone && view.dropBefore === before;
    const zone = (name: PivotZone) => {
        const items: { field: string; header: string; control?: Content }[] = view[name];
        return h(
            'section',
            mergeAttrs({ key: name }, part('pivotZone', { zone: name, dropping: view.dropZone === name })),
            h('h3', mergeAttrs(part('pivotZoneTitle'), { id: `${context.ids.table}-pivot-${name}` }), zoneName(name)),
            h(
                'ul',
                mergeAttrs(part('pivotZoneList'), {
                    'aria-labelledby': `${context.ids.table}-pivot-${name}`,
                    'data-pivot-zone': name,
                    onDragover: (event: DragEvent) => context.on.pivotDragOver(name, null, event),
                    onDrop: context.on.pivotDrop
                }),
                items.length
                    ? items.map((item, at) =>
                          h(
                              'li',
                              mergeAttrs({ key: item.field }, part('pivotItem', { dragging: view.dragging?.field === item.field && view.dragging.from === name, dropping: dropping(name, item.field) }), {
                                  'data-pivot-item': item.field,
                                  onDragover: (event: DragEvent) => context.on.pivotDragOver(name, item.field, event)
                              }),
                              h(
                                  'span',
                                  mergeAttrs(part('sideColumnHandle'), {
                                      role: 'button',
                                      tabindex: '0',
                                      draggable: 'true',
                                      'aria-label': formatMessage(words.moveColumn, { column: item.header }),
                                      'aria-roledescription': words.dragHandle,
                                      onDragstart: (event: DragEvent) => context.on.pivotDragStart(item.field, name, event),
                                      onDragend: context.on.pivotDragEnd,
                                      onKeydown: (event: KeyboardEvent) => context.on.pivotMoveKey(name, at, event)
                                  }),
                                  iconView('grip')
                              ),
                              h('span', part('pivotItemLabel'), item.header),
                              name === 'values' && item.control ? h('span', part('pivotItemHow'), item.control) : null,
                              h(
                                  'button',
                                  mergeAttrs({ type: 'button' }, part('headerToolButton'), {
                                      'aria-label': formatMessage(words.pivotRemove, { field: item.header, zone: zoneName(name) }),
                                      onClick: () => context.on.pivotRemove(name, at)
                                  }),
                                  iconView('close')
                              )
                          )
                      )
                    : [h('li', mergeAttrs({ key: 'empty' }, part('pivotEmpty')), words.pivotDropHere)]
            )
        );
    };
    return [
        // The switch stays at the top while the places and the fields scroll under it.
        h(
            'div',
            mergeAttrs({ key: 'mode' }, part('sidePanelHead')),
            h(
                'label',
                part('filterValue', { all: true }),
                h('input', {
                    type: 'checkbox',
                    role: 'switch',
                    checked: view.enabled,
                    'data-pivot-mode': '',
                    onChange: (event: Event) => context.on.pivotEnable((event.target as HTMLInputElement).checked)
                }),
                h('span', null, words.pivotMode)
            )
        ),
        zone('rows'),
        zone('columns'),
        zone('values'),
        h(
            'section',
            mergeAttrs({ key: 'fields' }, part('pivotZone', { zone: 'fields', dropping: view.dropZone === 'fields' })),
            h('h3', mergeAttrs(part('pivotZoneTitle'), { id: `${context.ids.table}-pivot-fields` }), words.pivotFields),
            h(
                'ul',
                mergeAttrs(part('sideColumns'), {
                    'aria-labelledby': `${context.ids.table}-pivot-fields`,
                    'data-pivot-zone': 'fields',
                    onDragover: (event: DragEvent) => context.on.pivotDragOver('fields', null, event),
                    onDrop: context.on.pivotDrop
                }),
                view.fields.map((field) =>
                    h(
                        'li',
                        mergeAttrs({ key: field.field }, part('sideColumn', { dragging: view.dragging?.field === field.field && view.dragging.from === 'fields' }), { 'data-pivot-field': field.field }),
                        h(
                            'span',
                            mergeAttrs(part('sideColumnHandle'), {
                                draggable: 'true',
                                'aria-hidden': 'true',
                                onDragstart: (event: DragEvent) => context.on.pivotDragStart(field.field, 'fields', event),
                                onDragend: context.on.pivotDragEnd
                            }),
                            iconView('grip')
                        ),
                        h(
                            'label',
                            part('filterValue'),
                            h('input', {
                                type: 'checkbox',
                                checked: field.used,
                                onChange: (event: Event) => context.on.pivotTick(field.field, (event.target as HTMLInputElement).checked)
                            }),
                            h('span', null, field.header)
                        ),
                        h(
                            'button',
                            mergeAttrs({ type: 'button' }, part('headerToolButton'), {
                                'aria-label': formatMessage(words.pivotFieldOptions, { field: field.header }),
                                'aria-haspopup': 'menu',
                                'data-pivot-menu': field.field,
                                onClick: (event: MouseEvent) => context.on.pivotFieldMenu(field.field, event)
                            }),
                            iconView('moreVertical')
                        )
                    )
                )
            )
        )
    ];
}

/** What the data dictionary shows, in the side bar's panel or in its drawer. */
export interface DictionaryView {
    entries: DictionaryEntry[];
    /** The module the table belongs to, and a line under the title. */
    module?: string;
    subtitle?: string;
    search: string;
}

/** Every column, shown or hidden, with what it holds and how it is worked out; the search finds them by either. */
function dictionaryBody<T>(context: ViewContext<T>, view: DictionaryView): Child[] {
    const { part, locale } = context;
    const words = locale.datagrid;
    return [
    view.module || view.subtitle
        ? h(
              'div',
              mergeAttrs({ key: 'heading' }, part('dictionaryHeading')),
              view.module ? h('span', part('dictionaryModule'), formatMessage(words.module, { module: view.module })) : null,
              view.subtitle ? h('p', part('dictionarySubtitle'), view.subtitle) : null
          )
        : null,
    h(
        'div',
        mergeAttrs({ key: 'search' }, part('sidePanelHead')),
        h(
            'span',
            part('filterField'),
            iconView('search'),
            h(
                'input',
                mergeAttrs({ type: 'search' }, part('filterInput'), {
                    value: view.search,
                    placeholder: words.searchColumns,
                    'aria-label': words.searchColumns,
                    'data-side-search': '',
                    onInput: (event: Event) => context.on.sideSearch((event.target as HTMLInputElement).value)
                })
            )
        )
    ),
    h(
        'dl',
        mergeAttrs({ key: 'entries' }, part('dictionary')),
        view.entries.map((entry) =>
            h(
                'div',
                mergeAttrs({ key: entry.key }, part('dictionaryEntry', { hidden: !entry.visible }), { 'data-dictionary': entry.key }),
                h(
                    'dt',
                    part('dictionaryTerm'),
                    h('span', null, entry.header),
                    kindTag(context, entry.kind),
                    entry.visible ? null : h('span', part('dictionaryHidden'), words.hiddenColumn)
                ),
                h('dd', part('dictionaryDetail'), aboutColumn(context, entry))
            )
        )
    )
];
}

/**
 * The data dictionary in a drawer at the page's edge, as a report shows it:
 * the same entries as the side bar's panel, over the page rather than beside
 * the table, shut by its button, Escape or a press outside it.
 */
function dictionaryDrawerView<T>(context: ViewContext<T>, view: DictionaryView): Child {
    const { part, locale, on, ids } = context;
    const words = locale.datagrid;
    const titleId = `${ids.table}-dictionary-title`;
    return h(
        'div',
        mergeAttrs({ key: 'dictionary-mask' }, part('drawerMask'), {
            onClick: (event: MouseEvent) => {
                if (event.target === event.currentTarget) on.dictionaryDrawer(false);
            }
        }),
        h(
            'div',
            mergeAttrs(part('drawer'), {
                role: 'dialog',
                'aria-modal': 'true',
                'aria-labelledby': titleId,
                tabindex: '-1',
                'data-dictionary-drawer': '',
                onKeydown: (event: KeyboardEvent) => {
                    if (event.key !== 'Escape') return;
                    event.stopPropagation();
                    on.dictionaryDrawer(false);
                }
            }),
            h(
                'div',
                part('drawerHeader'),
                h('h2', mergeAttrs(part('drawerTitle'), { id: titleId }), words.dictionaryPanel),
                h('button', mergeAttrs({ type: 'button' }, part('drawerClose'), { 'aria-label': words.drawerCancel, 'data-dictionary-close': '', onClick: () => on.dictionaryDrawer(false) }), iconView('close'))
            ),
            h('div', mergeAttrs(part('drawerContent'), { 'data-dictionary-body': '' }), dictionaryBody(context, view))
        )
    );
}

/** A cell of a heading row: a group over a run of columns, a column's own header, the room over one in fewer groups, or a spacer. */
type HeadEntry<T> =
    | { kind: 'group'; group: ColumnGroupRef<T>; columns: ResolvedColumn<T>[] }
    | { kind: 'leaf'; column: ResolvedColumn<T> }
    | { kind: 'blank'; column: ResolvedColumn<T> }
    | { kind: 'spacer'; spacer: ColumnSpacer };

/**
 * The head of a grid whose columns sit in groups: a row per level of groups,
 * then the columns' own. A group's heading spans the run of its columns drawn
 * side by side — split where a column of another group stands between them, or
 * where the pinned block ends, since one part of it stays and the other
 * scrolls. Every column's own header is in the last row; over a column in
 * fewer groups than the deepest, the rows it has no group in hold an empty
 * cell of the head's ground, which a reader is not told of.
 */
function groupedHeaderRows<T>(context: ViewContext<T>, depth: number): VElement[] {
    const { part } = context;
    const rows: VElement[] = [];
    for (let level = 0; level <= depth; level++) {
        const entries: HeadEntry<T>[] = [];
        /** Which drawn column each entry starts at, for where the filler goes. */
        const from: number[] = [];
        context.drawn.forEach((entry, at) => {
            if (isSpacer(entry)) {
                entries.push({ kind: 'spacer', spacer: entry });
                from.push(at);
                return;
            }
            const groups = entry.groups.length;
            if (level < groups) {
                const group = entry.groups[level]!;
                const last = entries.at(-1);
                const joined =
                    last?.kind === 'group' &&
                    last.group.key === group.key &&
                    // The same run: the column drawn just before is the group's, and on the same side of the pinned block.
                    context.drawn[at - 1] === last.columns.at(-1) &&
                    last.columns.at(-1)!.sticky?.side === entry.sticky?.side;
                if (joined) last.columns.push(entry);
                else {
                    entries.push({ kind: 'group', group, columns: [entry] });
                    from.push(at);
                }
            } else {
                entries.push({ kind: level === depth ? 'leaf' : 'blank', column: entry });
                from.push(at);
            }
        });
        const cellsOf = entries.map((entry) =>
            entry.kind === 'spacer'
                ? spacerCell(context, entry.spacer, 'headerCell')
                : entry.kind === 'leaf'
                  ? headerCell(context, entry.column)
                  : entry.kind === 'blank'
                    ? blankHeadCell(context, entry.column)
                    : groupCell(context, entry.group, entry.columns)
        );
        const end = fillerAt(context);
        const at = end < 0 ? -1 : from.findIndex((column) => column >= end);
        rows.push(
            h(
                'div',
                mergeAttrs({ key: `header-row-${level}`, role: 'row' }, part(level === depth ? 'headerRow' : 'columnGroupRow'), { 'aria-rowindex': headerRowIndex(context, level) }),
                withFiller(context, cellsOf, 'headerCell', at)
            )
        );
    }
    return rows;
}

/** The room over a column in fewer groups than the deepest: the head's ground, pinned where the column is. */
function blankHeadCell<T>(context: ViewContext<T>, column: ResolvedColumn<T>): VElement {
    return h(
        'div',
        mergeAttrs({ key: `blank:${column.key}`, 'aria-hidden': 'true' }, context.part('headerCell', pinnedState(column)), context.part('blankHeaderCell'), {
            style: stickyStyle(column)
        })
    );
}

/** A group's heading, over the run of its columns it was given. */
function groupCell<T>(context: ViewContext<T>, group: ColumnGroupRef<T>, columns: ResolvedColumn<T>[]): VElement {
    const first = columns[0]!;
    const last = columns.at(-1)!;
    const side = first.sticky?.side;
    // Stuck where the column nearest its edge is stuck.
    const anchor = side === 'right' ? last : first;
    const edge = columns.some((column) => column.sticky?.last);
    return h(
        'div',
        mergeAttrs(
            {
                key: `${group.key}:${first.key}`,
                role: 'columnheader',
                'aria-colspan': columns.length > 1 ? String(columns.length) : undefined
            },
            // Centred over its columns unless it says otherwise.
            context.part('columnGroupCell', {
                align: group.column.align ?? 'center',
                pinned: side,
                pinnedEdge: edge
            }),
            {
                'data-group': group.key,
                'aria-colindex': colIndex(context, first),
                style: { ...(columns.length > 1 ? { 'grid-column': `span ${columns.length}` } : {}), ...stickyStyle(anchor), ...group.column.headerStyle },
                class: group.column.headerClass
            }
        ),
        h('span', context.part('headerTitle'), content(group.column.headerContent?.({ column: group.column })) ?? group.column.header ?? '')
    );
}

const filterValue = (filters: FilterMeta, column: ResolvedColumn) => {
    const filter = filters[column.filterField];
    if (!filter) return undefined;
    return 'constraints' in filter ? filter.constraints[0]?.value : filter.value;
};
const filterText = (filters: FilterMeta, column: ResolvedColumn) => {
    const value = filterValue(filters, column);
    return value === null || value === undefined ? '' : String(value);
};

/**
 * The room the rows leave, down to the box's foot, as empty rows: one row of
 * the columns' own tracks, so its cells take the columns' widths, their rules
 * and their pinning, painted as rows of the body's height and stripes. Nothing
 * to read, so hidden from assistive technology.
 */
function fillView<T>(context: ViewContext<T>): Child {
    const fill = context.fillRows;
    if (!fill) return null;
    const { part } = context;
    const cells = context.drawn.map((entry) =>
        isSpacer(entry)
            ? h('div', mergeAttrs({ key: entry.key }, part('bodyCell', {}), part('fillCell')))
            : h('div', mergeAttrs({ key: entry.key }, part('bodyCell', { align: entry.align, ...pinnedState(entry) }), part('fillCell'), { style: stickyStyle(entry) }))
    );
    return h(
        'div',
        mergeAttrs({ key: 'fill', 'aria-hidden': 'true', 'data-section': 'fill' }, part('fillRows', { odd: fill.odd }), {
            style: fill.height ? { '--vt-datagrid-fill-row-height': `${fill.height}px` } : undefined
        }),
        h('div', mergeAttrs({ key: 'row' }, part('fillRow')), withFiller(context, cells, 'bodyCell'))
    );
}

/** Whether the table has a foot drawn under its body. */
const footPresent = <T>(context: ViewContext<T>) => hasFooter(context) || !!context.config.totalRow || context.pinnedBottom.length > 0;

function bodyView<T>(context: ViewContext<T>): Child {
    const { config, part, locale, rows, virtual } = context;
    if (skeletonShown(context)) return skeletonBody(context);
    if (!rows.page.length) {
        return h(
            'div',
            mergeAttrs({ key: 'tbody', role: 'rowgroup', 'data-section': 'body' }, part('tbody')),
            h(
                'div',
                mergeAttrs({ role: 'row' }, part('emptyRow')),
                h('div', mergeAttrs({ role: cellRole(context) }, part('emptyCell'), spanAll(context)), content(config.content?.empty?.()) ?? config.emptyMessage ?? locale.emptyMessage)
            )
        );
    }
    const start = virtual?.window.start ?? 0;
    const shown = virtual ? context.lines.slice(start, virtual.window.end) : context.lines;
    return h(
        'div',
        mergeAttrs({ key: 'tbody', role: 'rowgroup', 'data-section': 'body' }, part('tbody')),
        virtual ? spacerRows(context, 'before', virtual.window.before, virtual.rowsBefore) : null,
        shown.map((line, at) => lineView(context, line, start + at)),
        virtual ? spacerRows(context, 'after', virtual.window.after, 1) : null
    );
}

/**
 * The room the rows left out of view would take, as empty rows of that
 * height. One or two of them, as many as keep the drawn rows on the parity
 * they would have with every row there: a striped grid keeps its stripes on
 * the same rows as it scrolls.
 */
function spacerRows<T>(context: ViewContext<T>, side: 'before' | 'after', height: number, rowsHidden: number): Child[] {
    if (!(height > 0)) return [];
    const row = (key: string, px: number) =>
        h(
            'div',
            mergeAttrs({ key }, context.part('spacerRow'), {
                'aria-hidden': 'true',
                style: { height: `${px}px` }
            })
        );
    const out = [row(`__${side}`, height)];
    if (side === 'before' && rowsHidden % 2 === 0) out.push(row(`__${side}-parity`, 0));
    return out;
}

/**
 * A group's heading that carries values worked out over its rows: the toggle
 * and the title in the first column, and under each column with an aggregate,
 * its value, so the totals line up with the values they add up.
 */
function groupRowWithValues<T>(context: ViewContext<T>, line: Extract<GridLine<T>, { kind: 'group' }>, at: number, title: string): VElement {
    const { part, virtual } = context;
    const first = context.drawn.find((entry) => !isSpacer(entry)) as ResolvedColumn<T> | undefined;
    const toggle = h(
        'button',
        mergeAttrs({ type: 'button' }, part('groupToggle'), {
            'aria-expanded': line.collapsed ? 'false' : 'true',
            onClick: () => context.on.toggleGroup(line.group.key)
        }),
        iconView('chevronDown', part('groupIcon', { collapsed: line.collapsed })),
        h('span', part('groupTitle'), title),
        h('span', part('groupCount'), String(line.group.rows.length))
    );
    return h(
        'div',
        mergeAttrs({ key: `group-${line.group.key}`, role: 'row' }, part('groupRow', { values: true }), {
            'data-line': String(at),
            'aria-rowindex': virtual ? String(virtual.rowIndex(at)) : undefined
        }),
        cells(context, 'bodyCell', (column) => {
            const value = column.column.aggregate ? aggregateOf(column.column, line.group.rows) : undefined;
            const shown = column.column.aggregate
                ? (content(column.column.aggregateContent?.({ value, rows: line.group.rows, column: column.column })) ?? valueText(context, column.column, value))
                : null;
            const lead = column === first;
            return h(
                'div',
                mergeAttrs({ key: column.key }, part('groupCell', { level: line.level, lead, align: column.align, ...pinnedState(column) }), {
                    role: lead ? 'rowheader' : cellRole(context),
                    style: { ...stickyStyle(column), ...(line.level ? { '--vt-datagrid-group-level': String(line.level) } : {}) },
                    'aria-colindex': colIndex(context, column),
                    'data-aggregate': column.column.aggregate ? column.key : undefined
                }),
                lead ? [toggle, shown !== null ? h('span', part('groupAggregate'), shown) : null] : shown
            );
        })
    ) as VElement;
}

/** The column a tree's toggle and indentation go in: the first that holds values. */
const treeColumnOf = <T,>(columns: ResolvedColumn<T>[]) => columns.find((column) => !column.selectionMode && !column.column.expander && !column.column.rowEditor && !column.column.rowDrag && !column.column.rowNumber)?.key;

/** One line of the body: a group's heading, or a row and, when it is open, its detail. */
function lineView<T>(context: ViewContext<T>, line: ViewContext<T>['lines'][number], at: number): Child {
    const { columns, config, part, locale, rows, virtual } = context;
    const selectable = !!config.selectionMode;
    const rowIndex = virtual ? String(virtual.rowIndex(at)) : undefined;
    // A heading over the run of rows that share the grouping field. It
    // is a row of the table like any other, so the table keeps its
    // shape and a screen reader keeps its bearings.
    if (line.kind === 'group') {
        const title = groupTitle(config, line.group, line.field, line.level);
        if (columns.some((column) => column.column.aggregate)) return groupRowWithValues(context, line, at, title);
        return h(
            'div',
            mergeAttrs({ key: `group-${line.group.key}`, role: 'row' }, part('groupRow'), {
                'data-line': String(at),
                'aria-rowindex': rowIndex
            }),
            h(
                'div',
                mergeAttrs(part('groupCell', { level: line.level }), {
                    role: 'rowheader',
                    'aria-colspan': span(context),
                    style: { 'grid-column': '1 / -1', ...(line.level ? { '--vt-datagrid-group-level': String(line.level) } : {}) }
                }),
                h(
                    'button',
                    mergeAttrs({ type: 'button' }, part('groupToggle'), {
                        'aria-expanded': line.collapsed ? 'false' : 'true',
                        onClick: () => context.on.toggleGroup(line.group.key)
                    }),
                    iconView('chevronDown', part('groupIcon', { collapsed: line.collapsed })),
                    h('span', part('groupTitle'), title),
                    h('span', part('groupCount'), String(line.group.rows.length))
                )
            )
        );
    }
    const { row, index } = line;
    const selected = context.selectionKind ? context.selected(row) : false;
    const key = rowKey(config, row, index, rows.offset);
    const expandable = !!config.content?.rowExpansion && columns.some((c) => c.column.expander);
    const openKey = expansionKey(config, row, index, rows.offset);
    const expanded = expandable && isExpanded(context.models.expandedRows, openKey);
    const detailId = `${context.ids.table}-detail-${String(key).replace(/[^\w-]/g, '_')}`;
    const tree = line.tree;
    const treeColumn = tree ? treeColumnOf(columns) : undefined;
    const drag = context.rowDrag;
    const dropHere = drag && drag.over === index && drag.index !== index;
    const spans = colSpans(context, row, rows.offset + index);
    const main = h(
        'div',
        mergeAttrs({ key, role: 'row' }, part('row', { selectable, selected, expanded, dragging: drag?.index === index, dropBefore: dropHere && !drag.after, dropAfter: dropHere && drag.after }), {
            'aria-level': tree ? String(tree.depth + 1) : undefined,
            'aria-expanded': tree?.hasChildren ? String(tree.expanded) : undefined,
            'aria-setsize': tree ? String(tree.siblings) : undefined,
            'aria-posinset': tree ? String(tree.position) : undefined,
            class: config.rowClass?.(row),
            style: fixedHeight(context),
            'data-index': String(index),
            'data-line': String(at),
            'aria-rowindex': rowIndex,
            'aria-selected': context.selectionKind ? (selected ? 'true' : 'false') : undefined,
            tabindex: selectable && !context.cellFocus ? (index === context.tabRow ? '0' : '-1') : undefined,
            onClick: (event: MouseEvent) => context.on.rowClick(row, index, event),
            onKeydown: (event: KeyboardEvent) => context.on.rowKeydown(event, index)
        }),
        cells(context, 'bodyCell', (column) => {
            if (spans.covered.has(column.key)) return null;
            const open = !!context.editing && context.editing.index === index && context.editing.keys.includes(column.key);
            const focus = context.cellFocus;
            const across = spans.width.get(column.key);
            const run = open ? undefined : rowRuns(context).get(column.key)?.get(index);
            return h(
                'div',
                mergeAttrs(
                    { key: column.key, role: cellRole(context) },
                    part('bodyCell', {
                        align: column.align,
                        ...pinnedState(column),
                        editing: open,
                        editable: isEditable(column.column, row),
                        ...rangeState(context, index, column.key)
                    }),
                    column.selectionMode ? part('selectionCell') : {},
                    cellLook(context, column, row, index),
                    {
                        style: { ...stickyStyle(column), ...(across ? { gridColumn: `span ${across}` } : {}) },
                        'aria-colindex': colIndex(context, column),
                        'aria-colspan': across ? String(across) : undefined,
                        'data-col': column.key,
                        // Stacked, a cell reads its column's header as its label.
                        'data-label': context.stacked ? column.header : undefined,
                        ...runAttrs(column.key, run),
                        'data-editing': open ? '' : undefined,
                        'aria-selected': context.config.cellSelection ? String(!!context.range && context.range.box.rows.includes(index) && context.range.box.keys.includes(column.key)) : undefined,
                        tabindex: focus ? (focus.index === index && focus.key === column.key ? '0' : '-1') : undefined
                    }
                ),
                fillHandleAt(context, index, column.key),
                open
                    ? editorView(context, column, row, index)
                    : column.column.rowDrag
                      ? rowDragHandle(context, index)
                      : column.column.rowEditor
                      ? rowEditorView(context, index)
                      : column.column.expander && expandable
                        ? h(
                              'button',
                              mergeAttrs({ type: 'button' }, part('expander', { expanded }), {
                                  'aria-expanded': expanded ? 'true' : 'false',
                                  'aria-controls': expanded ? detailId : undefined,
                                  'aria-label': expanded ? locale.aria.collapse : locale.aria.expand,
                                  // The row's own click and keys are about selection, not this.
                                  onClick: (event: MouseEvent) => {
                                      event.stopPropagation();
                                      context.on.toggleExpansion(openKey);
                                  },
                                  onKeydown: (event: KeyboardEvent) => event.stopPropagation()
                              }),
                              iconView('chevronRight', part('expanderIcon', { expanded }))
                          )
                        : column.selectionMode
                          ? h(
                                'span',
                                part('checkbox'),
                                h(
                                    'input',
                                    mergeAttrs(
                                        {
                                            type: column.selectionMode === 'multiple' ? 'checkbox' : 'radio'
                                        },
                                        part('checkboxInput'),
                                        {
                                            checked: selected,
                                            'aria-label': locale.aria.selectRow,
                                            onChange: (event: Event) => context.on.toggleRow(row, index, event, column.selectionMode === 'multiple' ? 'checkbox' : 'radio')
                                        }
                                    )
                                ),
                                selected && column.selectionMode === 'multiple' ? iconView('check', part('checkboxIcon')) : null
                            )
                          : tree && column.key === treeColumn
                            ? treeCell(context, row, tree, cellContent(context, column, row, rows.offset + index))
                            : cellContent(context, column, row, rows.offset + index)
            );
        })
    );
    if (!expanded) return main;
    // The detail spans the table in a row of its own, right under the row it belongs to.
    return [
        main,
        h(
            'div',
            mergeAttrs({ key: `${key}-detail`, id: detailId, role: 'row' }, part('expansionRow'), {
                'data-line': String(at),
                'aria-rowindex': virtual ? String(virtual.rowIndex(at) + 1) : undefined
            }),
            h('div', mergeAttrs({ role: cellRole(context) }, part('expansionCell'), spanAll(context)), content(config.content!.rowExpansion!({ row, index: rows.offset + index })))
        )
    ];
}

/**
 * A cell open for editing: the host's editor, or a box of the kind the value
 * was — a checkbox for a boolean, a date input for a date, a text box that
 * asks for decimals for a number — and under it, why a value was refused.
 */
function editorView<T>(context: ViewContext<T>, column: ResolvedColumn<T>, row: T, index: number): Child {
    const { part, locale } = context;
    const editing = context.editing!;
    const key = column.key;
    const value = editing.values[key];
    const error = editing.errors[key];
    const errorId = `${context.ids.table}-error-${index}-${key.replace(/[^\w-]/g, '_')}`;
    const message = error
        ? h(
              'span',
              mergeAttrs({ key: 'error', id: errorId }, part('editorError'), {
                  role: 'alert'
              }),
              error
          )
        : null;
    const own = content(
        column.column.editor?.({
            row,
            index: context.rows.offset + index,
            field: column.field,
            value,
            column: column.column,
            error,
            errorId,
            setValue: (next: unknown) => context.on.editInput(key, next, true),
            commit: () => context.on.commitEdit(),
            cancel: () => context.on.cancelEdit()
        })
    );
    if (own !== null) return [own, message];
    const kind = editing.kinds[key] ?? editorKind(cellValue(column.column, row));
    const label = formatMessage(locale.datagrid.editCell, {
        column: column.header
    });
    const shared = {
        'data-editor': key,
        'aria-label': label,
        'aria-invalid': error ? 'true' : undefined,
        'aria-errormessage': error ? errorId : undefined
    };
    if (kind === 'checkbox')
        return [
            h(
                'span',
                mergeAttrs({ key: 'editor' }, part('checkbox')),
                h(
                    'input',
                    mergeAttrs({ type: 'checkbox' }, part('checkboxInput'), shared, {
                        checked: !!value,
                        onChange: (event: Event) => context.on.editInput(key, (event.target as HTMLInputElement).checked)
                    })
                ),
                value ? iconView('check', part('checkboxIcon')) : null
            ),
            message
        ];
    return [
        h(
            'span',
            mergeAttrs({ key: 'editor' }, part('editorField', { invalid: !!error })),
            h(
                'input',
                mergeAttrs({ type: kind === 'date' ? 'date' : 'text' }, part('editorInput'), shared, {
                    inputmode: kind === 'number' ? 'decimal' : undefined,
                    value: value === null || value === undefined ? '' : String(value),
                    onInput: (event: Event) => context.on.editInput(key, (event.target as HTMLInputElement).value)
                })
            )
        ),
        message
    ];
}

/** The buttons that edit a row as a whole: Edit, or Save and Cancel while it is open. */
function rowEditorView<T>(context: ViewContext<T>, index: number): Child {
    const { part, locale } = context;
    const open = !!context.editing?.row && context.editing.index === index;
    const button = (name: string, label: string, icon: string, press: (event: Event) => void) =>
        h(
            'button',
            mergeAttrs({ key: name, type: 'button' }, part('rowEditorButton', { action: name }), {
                'aria-label': label,
                'data-row-editor': name,
                onClick: (event: MouseEvent) => {
                    // The row's own click is about selection, not this.
                    event.stopPropagation();
                    press(event);
                }
            }),
            iconView(icon)
        );
    return h(
        'span',
        part('rowEditor'),
        open
            ? [button('save', locale.datagrid.saveRow, 'check', context.on.commitEdit), button('cancel', locale.datagrid.cancelRow, 'close', context.on.cancelEdit)]
            : button('edit', locale.datagrid.editRow, 'pencil', (event) => context.on.editRow(index, event))
    );
}

/** What a cell shows: what its column draws, or its value as text. */
function cellContent<T>(context: ViewContext<T>, column: ResolvedColumn<T>, row: T, index: number, pinned?: 'top' | 'bottom'): Child {
    // `index` counts from the first page's first row; the runs are kept by the place on this page.
    if (column.column.rowNumber) return pinned ? '' : String(index + 1);
    const cell = cellContextOf(column, row, index, pinned);
    const shown = content(column.column.body?.(cell)) ?? (column.column.sparkline ? sparklineCell(context, column, row, cell.value) : valueText(context, column.column, cell.value, row));
    // A pinned row's index is its place in its band; a body row's counts from the first page.
    const run = rowRuns(context, pinned ?? 'body').get(column.key)?.get(pinned ? index : index - context.rows.offset);
    if (!run) return shown;
    // The top of a run draws the value once over every row of it; the rows below still say it, to a screen reader.
    if (run.place !== 'start') return h('span', { class: 'vt-sr-only' }, shown);
    // The value keeps to the part of a tall run in view as the grid scrolls.
    return h('div', mergeAttrs(context.part('rowRun'), { 'data-row-run-content': '', style: { '--vt-datagrid-row-run-rows': String(run.size) } }), h('div', context.part('rowRunValue', { sticky: column.column.spanRowsSticky !== false }), shown));
}

/** Which columns a row's cells cover beside their own, and which cells that leaves out. */
function colSpans<T>(context: ViewContext<T>, row: T, index: number, pinned?: 'top' | 'bottom'): { width: Map<string, number>; covered: Set<string> } {
    const width = new Map<string, number>();
    const covered = new Set<string>();
    const drawn = context.drawn;
    for (let at = 0; at < drawn.length; at++) {
        const entry = drawn[at]!;
        if (isSpacer(entry) || covered.has(entry.key) || !entry.column.colSpan) continue;
        let n = Math.floor(entry.column.colSpan(cellContextOf(entry, row, index, pinned)) || 1);
        // A span stops at a spacer: the columns past it are not drawn.
        for (let next = at + 1; next < at + n; next++) {
            const other = drawn[next];
            if (!other || isSpacer(other)) {
                n = next - at;
                break;
            }
            covered.add(other.key);
        }
        if (n > 1) width.set(entry.key, n);
    }
    return { width, covered };
}

/** Where a row stands in a run of one value down a column: its place, and how many rows the run has. */
type RunPlace = { place: 'start' | 'middle' | 'end'; size: number };
type Runs = Map<string, Map<number, RunPlace>>;

// Runs of one value down a column, worked out once a drawing for each band: a row's place in its run by column.
const runsMemo = new WeakMap<object, Partial<Record<'body' | 'top' | 'bottom', Runs>>>();

/**
 * The runs among the rows of a band as drawn — the body's rows, or the rows pinned at the top or the bottom,
 * each band on its own. A virtual grid starts them at the first row in view, so the top of each is always
 * drawn. A heading between rows ends a run, as does an open row's detail or a different value.
 */
function rowRuns<T>(context: ViewContext<T>, band: 'body' | 'top' | 'bottom' = 'body'): Runs {
    const memo = runsMemo.get(context) ?? {};
    runsMemo.set(context, memo);
    const known = memo[band];
    if (known) return known;
    const out: Runs = new Map();
    memo[band] = out;
    const columns = context.drawn.filter((entry): entry is ResolvedColumn<T> => !isSpacer(entry) && !!entry.column.spanRows);
    if (!columns.length) return out;
    // A row, or null where a run must end.
    let rows: ({ row: T; index: number; closes?: boolean } | null)[];
    if (band === 'body') {
        const lines = context.virtual ? context.lines.slice(context.virtual.window.start, context.virtual.window.end) : context.lines;
        const expandable = !!context.config.content?.rowExpansion && context.columns.some((c) => c.column.expander);
        const open = (row: T, index: number) => expandable && isExpanded(context.models.expandedRows, expansionKey(context.config, row, index, context.rows.offset));
        rows = lines.map((line) => (line.kind === 'row' ? { row: line.row, index: line.index, closes: open(line.row, line.index) } : null));
    } else rows = (band === 'top' ? context.pinnedTop : context.pinnedBottom).map((row, index) => ({ row, index }));
    for (const entry of columns) {
        const rule = entry.column.spanRows!;
        const same = typeof rule === 'function' ? rule : (a: { value: unknown }, b: { value: unknown }) => sameValue(a.value, b.value);
        const places = new Map<number, RunPlace>();
        let run: number[] = [];
        let last: { row: T; value: unknown } | null = null;
        const close = () => {
            const size = run.length;
            if (size > 1) run.forEach((index, at) => places.set(index, { place: at === 0 ? 'start' : at === size - 1 ? 'end' : 'middle', size }));
            run = [];
            last = null;
        };
        for (const item of rows) {
            if (!item) {
                close();
                continue;
            }
            const here = { row: item.row, value: valueOf(item.row, entry) };
            if (last && !same(last, here)) close();
            run.push(item.index);
            last = here;
            if (item.closes) close();
        }
        close();
        if (places.size) out.set(entry.key, places);
    }
    return out;
}

/** What a cell in a run says of it, for the CSS and for the height measured once drawn. */
const runAttrs = (key: string, run: RunPlace | undefined) =>
    run ? { 'data-row-run': run.place, 'data-row-run-col': key, 'data-row-run-rows': run.place === 'start' ? String(run.size) : undefined } : {};

const sameValue = (a: unknown, b: unknown) => a === b || (a instanceof Date && b instanceof Date && a.getTime() === b.getTime());

/** What a cell's own functions are given. */
const cellContextOf = <T,>(column: ResolvedColumn<T>, row: T, index: number, pinned?: 'top' | 'bottom'): CellContext<T> => ({
    row,
    index,
    field: column.field,
    value: valueOf(row, column),
    column: column.column,
    pinned,
    key: column.key
});

/** A value as text: the column's own way of writing it, or the plain one. */
export function valueText<T>(context: ViewContext<T>, column: DataGridColumn<T>, value: unknown, row?: T): string {
    return column.valueFormatter ? column.valueFormatter(value, row) : cellText(value, context.locale.code);
}

/** A cell's class, style and tooltip, as its column works them out for it. */
function cellLook<T>(context: ViewContext<T>, column: ResolvedColumn<T>, row: T, index: number, pinned?: 'top' | 'bottom'): Props {
    const own = column.column;
    if (!own.bodyClass && !own.bodyStyle && !own.tooltip) return {};
    const cell = cellContextOf(column, row, index, pinned);
    const tip = typeof own.tooltip === 'function' ? own.tooltip(cell) : own.tooltip ? valueText(context, own, cell.value, row) : undefined;
    return {
        class: typeof own.bodyClass === 'function' ? own.bodyClass(cell) : own.bodyClass,
        style: (typeof own.bodyStyle === 'function' ? own.bodyStyle(cell) : own.bodyStyle) ?? undefined,
        title: tip || undefined
    };
}

// The range a column's sparklines share, worked out once a drawing — a row's numbers may change in place between two.
const sharedDomains = new WeakMap<object, Map<string, [number, number]>>();

function sparklineCell<T>(context: ViewContext<T>, column: ResolvedColumn<T>, row: T, value: unknown): Child {
    const spark = column.column.sparkline!;
    const shared = spark.domain ?? (spark.type === 'bar' ? 'column' : 'cell');
    let domain: [number, number] | undefined = Array.isArray(shared) ? shared : undefined;
    if (shared === 'column') {
        let byColumn = sharedDomains.get(context);
        if (!byColumn) sharedDomains.set(context, (byColumn = new Map()));
        domain = byColumn.get(column.key);
        if (!domain) byColumn.set(column.key, (domain = sparklineDomain(spark, context.rows.all, (r) => valueOf(r, column))));
    }
    return sparklineView({ spark, row, values: sparklinePoints(spark, row, value), domain, locale: context.locale, part: context.part });
}

/** Where a cell stands in the marked block: in it, on which of its edges, or under a fill. */
function rangeState<T>(context: ViewContext<T>, index: number, key: string) {
    const range = context.range;
    if (!range) return {};
    const { box, fill } = range;
    const inRange = box.rows.includes(index) && box.keys.includes(key);
    // A fill is the block grown over the cells it would write, and its outline goes round them all.
    const filling = !!fill && !inRange && fill.rows.includes(index) && fill.keys.includes(key);
    const rows = fill?.rows ?? box.rows;
    const keys = fill?.keys ?? box.keys;
    const inside = rows.includes(index) && keys.includes(key);
    return {
        inRange,
        fillTarget: filling,
        rangeTop: inside && index === rows[0],
        rangeBottom: inside && index === rows.at(-1),
        rangeStart: inside && key === keys[0],
        rangeEnd: inside && key === keys.at(-1)
    };
}

/** The fill handle, at the bottom corner of the marked block. */
function fillHandleAt<T>(context: ViewContext<T>, index: number, key: string): Child {
    const range = context.range;
    if (!range?.handle || range.fill || index !== range.box.rows.at(-1) || key !== range.box.keys.at(-1)) return null;
    return h('span', mergeAttrs(context.part('fillHandle'), { 'data-fill-handle': '', 'aria-hidden': 'true' }));
}

/** A row of a tree's first cell: indented by its depth, with a toggle when it holds rows. */
function treeCell<T>(context: ViewContext<T>, row: T, tree: NonNullable<Extract<GridLine<T>, { kind: 'row' }>['tree']>, inner: Child): Child {
    const { part, locale } = context;
    return h(
        'span',
        mergeAttrs(part('treeCell'), { style: { '--vt-datagrid-tree-depth': String(tree.depth) } }),
        tree.hasChildren
            ? h(
                  'button',
                  mergeAttrs({ type: 'button' }, part('treeToggle', { expanded: tree.expanded }), {
                      'aria-expanded': String(tree.expanded),
                      'aria-label': tree.expanded ? locale.aria.collapse : locale.aria.expand,
                      'data-tree-toggle': String(tree.key),
                      tabindex: context.cellFocus ? '-1' : undefined,
                      onClick: (event: MouseEvent) => {
                          event.stopPropagation();
                          context.on.toggleTree(row, tree.key, event);
                      }
                  }),
                  iconView('chevronRight', part('treeIcon', { expanded: tree.expanded }))
              )
            : h('span', mergeAttrs(part('treeSpacer'), { 'aria-hidden': 'true' })),
        h('span', part('treeContent'), inner)
    );
}

/** The handle a row is dragged by, which Ctrl and an arrow key move too. */
function rowDragHandle<T>(context: ViewContext<T>, index: number): Child {
    const { part, locale } = context;
    return h(
        'span',
        mergeAttrs(part('rowDragHandle'), {
            role: 'button',
            tabindex: context.cellFocus ? '-1' : '0',
            draggable: 'true',
            'aria-label': locale.datagrid.moveRow,
            'aria-roledescription': locale.datagrid.dragHandle,
            'data-row-drag': String(index),
            onDragstart: (event: DragEvent) => context.on.rowDragStart(index, event),
            onDragend: context.on.rowDragEnd,
            onKeydown: (event: KeyboardEvent) => context.on.rowMoveKey(index, event)
        }),
        iconView('grip')
    );
}

/** Every row the height the grid was told, when it was told one. */
const fixedHeight = <T>(context: ViewContext<T>) => (context.config.rowHeight ? { height: `${context.config.rowHeight}px` } : undefined);

/**
 * A row held at the top or the bottom while the rest scroll: drawn by the
 * columns as any row is, so a total reads in the format of the values above
 * it, but with nothing to select or open.
 */
function pinnedRowView<T>(context: ViewContext<T>, row: T, index: number, position: 'top' | 'bottom'): VElement {
    const { part } = context;
    const before = position === 'top' ? headRowCount(context) - context.pinnedTop.length : 0;
    const spans = colSpans(context, row, index, position);
    return h(
        'div',
        mergeAttrs({ key: `pinned-${position}-${index}`, role: 'row' }, part('row', {}), part('pinnedRow', { position }), {
            class: context.config.rowClass?.(row),
            style: fixedHeight(context),
            'aria-rowindex': context.virtual ? String(position === 'top' ? before + index + 1 : context.virtual.rowCount - context.pinnedBottom.length - footRows(context) + index + 1) : undefined
        }),
        cells(context, 'bodyCell', (column) => {
            if (spans.covered.has(column.key)) return null;
            const across = spans.width.get(column.key);
            return h(
                'div',
                mergeAttrs({ key: column.key, role: cellRole(context) }, part('bodyCell', { align: column.align, ...pinnedState(column) }), part('pinnedRowCell'), cellLook(context, column, row, index, position), {
                    style: { ...stickyStyle(column), ...(across ? { gridColumn: `span ${across}` } : {}) },
                    'aria-colindex': colIndex(context, column),
                    'aria-colspan': across ? String(across) : undefined,
                    ...runAttrs(column.key, rowRuns(context, position).get(column.key)?.get(index))
                }),
                column.selectionMode || column.column.expander ? null : cellContent(context, column, row, index, position)
            );
        })
    );
}

/** Whether the columns write a footer row. */
const hasFooter = <T>(context: ViewContext<T>) => context.columns.some((column) => column.column.footer !== undefined || column.column.footerContent);
const footRows = <T>(context: ViewContext<T>) => (hasFooter(context) ? 1 : 0) + (context.config.totalRow ? 1 : 0);

/** A column's value in the totals row: the one the host gave, or its `aggregate` over every row the filters let through. */
function totalCell<T>(context: ViewContext<T>, column: ResolvedColumn<T>): Child {
    const given = context.config.totalRow;
    const rows = context.rows.all;
    const value = typeof given === 'object' ? given[column.key] : column.column.aggregate ? aggregateOf(column.column, rows) : undefined;
    if (value === undefined) return '';
    return content(column.column.aggregateContent?.({ value, rows, column: column.column })) ?? valueText(context, column.column, value);
}

/** How many rows the head and the foot add to the body's, for `aria-rowcount`. */
export const frameRows = <T>(context: Pick<ViewContext<T>, 'columns' | 'config' | 'filters' | 'pinnedTop' | 'pinnedBottom'>): { head: number; foot: number } => ({
    head: headRowCount(context as ViewContext<T>),
    foot: context.pinnedBottom.length + footRows(context as ViewContext<T>)
});

/**
 * How many placeholder rows: as many as are drawn now, so fetching again does
 * not change the table's height; with none, a page's worth, or five. A virtual
 * grid draws no more than it would draw rows.
 */
function skeletonCount<T>(context: ViewContext<T>): number {
    const { config, lines, models, virtual } = context;
    if (config.skeletonRows !== undefined) return Math.max(0, Math.floor(config.skeletonRows));
    if (virtual && lines.length) return Math.max(1, virtual.window.end - virtual.window.start);
    if (lines.length) return lines.length;
    return config.paginator ? models.rows : 5;
}

/** A bar's width, between 40% and 90%: uneven, as text is, and the same on every render. */
const barWidth = (row: number, column: number) => `${40 + ((row * 7 + column * 3) % 11) * 5}%`;

/**
 * The rows the table will have, drawn in the parts a row is drawn in — the
 * same cells, alignment, pinning and column styles — so the placeholder is
 * the table's own shape rather than a picture of it.
 */
function skeletonBody<T>(context: ViewContext<T>): Child {
    const { part } = context;
    return h(
        'div',
        mergeAttrs({ key: 'tbody', role: 'rowgroup', 'data-section': 'body' }, part('tbody')),
        Array.from({ length: skeletonCount(context) }, (_, index) =>
            h(
                'div',
                mergeAttrs({ key: `skeleton-${index}`, role: 'row' }, part('row', { skeleton: true }), { 'aria-hidden': 'true', style: fixedHeight(context) }),
                cells(context, 'bodyCell', (column) =>
                    h(
                        'div',
                        mergeAttrs({ key: column.key }, part('bodyCell', { align: column.align, ...pinnedState(column) }), column.selectionMode ? part('selectionCell') : {}, {
                            style: { ...stickyStyle(column), ...(typeof column.column.bodyStyle === 'object' ? column.column.bodyStyle : {}) },
                            class: typeof column.column.bodyClass === 'string' ? column.column.bodyClass : undefined
                        }),
                        content(column.column.skeleton?.({ column: column.column, index })) ??
                            (column.selectionMode
                                ? // The box the control will be, where the control will be.
                                  h(
                                      'span',
                                      part('checkbox'),
                                      h(
                                          'span',
                                          part('skeleton', {
                                              box: true,
                                              round: column.selectionMode === 'single'
                                          })
                                      )
                                  )
                                : h(
                                      'span',
                                      mergeAttrs(part('skeleton'), {
                                          style: { width: barWidth(index, column.position - 1) }
                                      })
                                  ))
                    )
                )
            )
        )
    );
}

function footView<T>(context: ViewContext<T>): Child {
    const { part } = context;
    const footer = hasFooter(context);
    const totals = !!context.config.totalRow;
    if (!footer && !totals && !context.pinnedBottom.length) return null;
    return h(
        'div',
        // Held at the bottom of the box while the rows scroll, when it holds rows pinned there.
        mergeAttrs({ key: 'tfoot', role: 'rowgroup', 'data-section': 'foot' }, part('tfoot', { sticky: context.pinnedBottom.length > 0 })),
        context.pinnedBottom.map((row, index) => pinnedRowView(context, row, index, 'bottom')),
        footer
            ? h(
                  'div',
                  mergeAttrs({ key: 'footer-row', role: 'row' }, part('footerRow'), {
                      'aria-rowindex': context.virtual ? String(context.virtual.rowCount) : undefined
                  }),
                  cells(context, 'footerCell', (column) =>
                      h(
                          'div',
                          mergeAttrs(
                              { key: column.key, role: cellRole(context) },
                              part('footerCell', {
                                  align: column.align,
                                  ...pinnedState(column)
                              }),
                              {
                                  style: stickyStyle(column),
                                  'aria-colindex': colIndex(context, column)
                              }
                          ),
                          content(column.column.footerContent?.({ column: column.column })) ?? column.column.footer ?? ''
                      )
                  )
              )
            : null,
        totals
            ? h(
                  'div',
                  mergeAttrs({ key: 'totals-row', role: 'row' }, part('totalRow'), {
                      'aria-rowindex': context.virtual ? String(context.virtual.rowCount + (footer ? 1 : 0)) : undefined
                  }),
                  cells(context, 'footerCell', (column) =>
                      h(
                          'div',
                          mergeAttrs(
                              { key: column.key, role: cellRole(context) },
                              part('footerCell', { align: column.align, ...pinnedState(column) }),
                              { style: stickyStyle(column), 'aria-colindex': colIndex(context, column), 'data-total': column.key }
                          ),
                          totalCell(context, column)
                      )
                  )
              )
            : null
    );
}

/**
 * The controls the template names, in the order it names them: the ends are
 * announced disabled rather than disabled, so focus stays on "Next" when it
 * reaches the last page instead of falling to the document.
 */
function paginatorView<T>(context: ViewContext<T>): Child {
    const { config, models, part, pagePart, locale, rows } = context;
    const count = pageCount(rows.total, models.rows);
    const page = Math.min(pageOf(models.first, models.rows), Math.max(0, count - 1));
    const state: PageContext = {
        first: models.first,
        rows: models.rows,
        page,
        pageCount: count,
        total: rows.total
    };
    const own = content(config.content?.paginator?.(state));
    if (own !== null) return own;

    const atStart = page <= 0;
    const atEnd = page >= count - 1;
    const go = (target: number) => () => context.on.page(Math.max(0, Math.min(count - 1, target)) * models.rows, models.rows);
    const button = (name: string, label: string, icon: string, target: number, off: boolean) =>
        h(
            'button',
            mergeAttrs({ key: name, type: 'button' }, pagePart(name), {
                'aria-label': label,
                'aria-disabled': off ? 'true' : undefined,
                onClick: go(target)
            }),
            iconView(icon)
        );
    const item = (name: string): Child => {
        switch (name) {
            case 'FirstPageLink':
                return button('first', locale.aria.first, 'chevronsLeft', 0, atStart);
            case 'PrevPageLink':
                return button('prev', locale.aria.previous, 'chevronLeft', page - 1, atStart);
            case 'NextPageLink':
                return button('next', locale.aria.next, 'chevronRight', page + 1, atEnd);
            case 'LastPageLink':
                return button('last', locale.aria.last, 'chevronsRight', count - 1, atEnd);
            case 'PageLinks':
                return h(
                    'span',
                    mergeAttrs({ key: 'pages' }, pagePart('pages')),
                    pageLinks(page, count, config.pageLinkSize ?? 5).map((index) =>
                        h(
                            'button',
                            mergeAttrs({ key: `page-${index}`, type: 'button' }, pagePart('page', { selected: index === page }), {
                                'aria-current': index === page ? 'page' : undefined,
                                'aria-label': formatMessage(locale.aria.page, {
                                    page: index + 1
                                }),
                                onClick: go(index)
                            }),
                            String(index + 1)
                        )
                    )
                );
            case 'CurrentPageReport':
                return h(
                    'span',
                    mergeAttrs({ key: 'report' }, pagePart('current'), {
                        'aria-live': 'polite'
                    }),
                    formatMessage(config.currentPageReportTemplate ?? locale.pageReport, pageReportParams(models.first, models.rows, rows.total))
                );
            case 'PageInput':
                // The page typed and taken on Enter or when the box is left; a page past either end is the end.
                return h(
                    'label',
                    mergeAttrs({ key: 'page-input' }, pagePart('pageInput')),
                    h('span', null, locale.pageInput),
                    h(
                        'input',
                        mergeAttrs({ type: 'text', inputmode: 'numeric' }, pagePart('pageInputBox'), {
                            value: String(count ? page + 1 : 0),
                            size: String(Math.max(2, String(count).length)),
                            'aria-label': locale.pageInput,
                            'data-page-input': '',
                            onKeydown: (event: KeyboardEvent) => {
                                if (event.key !== 'Enter') return;
                                event.preventDefault();
                                context.on.pageInput(Number((event.target as HTMLInputElement).value));
                            },
                            onChange: (event: Event) => context.on.pageInput(Number((event.target as HTMLInputElement).value))
                        })
                    ),
                    h('span', null, formatMessage(locale.pageOfCount, { count: count }))
                );
            case 'RowsPerPageLabel':
                return (config.rowsPerPageOptions ?? []).length ? h('span', mergeAttrs({ key: 'rows-per-page-label' }, pagePart('rowsPerPageLabel'), { 'aria-hidden': 'true' }), `${locale.pageSize}:`) : null;
            case 'RowsPerPageDropdown': {
                const options = config.rowsPerPageOptions ?? [];
                if (!options.length) return null;
                const own = content(
                    config.content?.rowsPerPage?.({
                        ...state,
                        options,
                        setRows: context.on.pageSize
                    })
                );
                if (own !== null) return own;
                // A native select: the reader's own platform draws it, which on a
                // phone is the picker they already know.
                return h(
                    'select',
                    mergeAttrs({ key: 'rows-per-page' }, pagePart('rowsPerPage'), {
                        'aria-label': locale.rowsPerPage,
                        value: String(models.rows),
                        onChange: (event: Event) => context.on.pageSize(Number((event.target as HTMLSelectElement).value))
                    }),
                    options.map((size) =>
                        h(
                            'option',
                            {
                                key: size,
                                value: String(size),
                                selected: size === models.rows
                            },
                            String(size)
                        )
                    )
                );
            }
            default:
                return null;
        }
    };
    const template = config.paginatorTemplate ?? ['FirstPageLink', 'PrevPageLink', 'PageLinks', 'NextPageLink', 'LastPageLink', 'RowsPerPageDropdown'];
    const items = typeof template === 'string' ? template.split(/\s+/).filter(Boolean) : template;
    const start = content(config.content?.paginatorStart?.(state));
    const end = content(config.content?.paginatorEnd?.(state));
    return h(
        'nav',
        mergeAttrs({ key: 'paginator' }, pagePart('root'), part('paginator', { position: config.paginatorPosition ?? 'bottom' }), { 'aria-label': locale.aria.pagination }),
        start === null ? null : h('div', mergeAttrs({ key: 'start' }, pagePart('start')), start),
        items.map(item),
        end === null ? null : h('div', mergeAttrs({ key: 'end' }, pagePart('end')), end)
    );
}

const valueOf = <T,>(row: T, column: ResolvedColumn<T>): unknown => (column.column.valueGetter ? column.column.valueGetter(row) : column.field ? getField(row, column.field) : undefined);
