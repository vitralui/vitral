import { formatMessage, getField, MIN_COLUMN_WIDTH, pageCount, pageLinks, pageOf, pageReportParams, type FilterMeta, type Locale } from '@vitral/core';
import { aggregateOf, type GridLine } from '../engine/rows';
import type { RangeBox } from '../engine/range';
import { h, iconNode, mergeAttrs, type Child, type Props, type VElement } from '@vitral/dom';
import { getIcon } from '@vitral/icons';
import type { FilterKind } from '../engine/filters';
import { cellText, expansionKey, groupDepth, groupTitle, isExpanded, isFilterable, rowKey, type ColumnGroupRef, type ResolvedColumn, type ResolvedRows } from '../engine/state';
import type { VirtualWindow } from '../engine/virtual';
import { cellValue, editorKind, isEditable, type EditorKind } from '../engine/edit';
import type { Content, PageContext, Row, DataGridColumn, DataGridConfig, DataGridModels, StatusContext } from '../engine/types';

/**
 * The table as plain objects: a real `<table>`, one `<th scope="col">` a
 * column, a sortable header holding a button that carries the sort, native
 * controls for selection and filtering, and a paginator of buttons. What is
 * drawn is decided here; what happens when it is pressed is the handle's.
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
    /** The buttons a header draws besides its title, and the column whose panel or menu is open. */
    menus: { filter: boolean; column: boolean; open: string | null };
    /** The filter panel, while one is open. */
    filterPanel?: FilterPanelView;
    /** A row being dragged, and where it would land: before or after the row at that index. */
    rowDrag?: { index: number; over: number | null; after: boolean };
    /** The counts the status bar shows, when it shows. */
    status?: StatusContext<T>;
    /** The block of cells marked, the cells a fill would write, and whether the fill handle is drawn. */
    range?: { box: RangeBox; fill: RangeBox | null; handle: boolean };
    /** The side bar, when the grid has one: its tabs, the panel open, and what the panels list. */
    sideBar?: SideBarView;
}

export type SidePanel = 'columns' | 'filters';

export interface SideBarView {
    panels: SidePanel[];
    open: SidePanel | null;
    search: string;
    columns: { key: string; header: string; visible: boolean; last: boolean }[];
    filters: { key: string; header: string; active: boolean; open: boolean }[];
    /** A column of the list being dragged, and the one it would land before. */
    dragging: string | null;
    dropOn: string | null;
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
    values: { label: string; checked: boolean }[];
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
    /** How many `<tr>` come before the first line drawn, which keeps the stripes where they were. */
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
    sideSearch: (text: string) => void;
    sideAll: (visible: boolean, event: Event) => void;
    sideMoveKey: (key: string, event: KeyboardEvent) => void;
    sideDragStart: (key: string, event: DragEvent) => void;
    sideDragOver: (key: string, event: DragEvent) => void;
    sideDrop: (event: DragEvent) => void;
    sideDragEnd: () => void;
    sideFilter: (key: string) => void;
    clearAllFilters: (event: Event) => void;
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
                style: config.scrollable && config.scrollHeight && config.scrollHeight !== 'flex' ? { 'max-height': config.scrollHeight } : undefined,
                onScroll: context.on.scrolled,
                ref: context.on.scroller
            }),
            h(
                'table',
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
                        // Moving through cells and editing them makes it an interactive grid.
                        role: context.lines.some((line) => line.kind === 'row' && line.tree) ? 'treegrid' : context.cellFocus ? 'grid' : undefined,
                        onKeydown: context.on.gridKeydown,
                        onClick: context.on.gridClick,
                        onDblclick: context.on.gridDblclick,
                        onContextmenu: config.contextMenu ? context.on.gridContextmenu : undefined,
                        onPointerdown: config.cellSelection ? context.on.gridPointerdown : undefined,
                        onCopy: context.cellFocus ? context.on.gridCopy : undefined,
                        onPaste: context.cellFocus ? context.on.gridPaste : undefined,
                        onDragover: context.rowDrag ? context.on.rowDragOver : undefined,
                        onDrop: context.rowDrag ? context.on.rowDrop : undefined,
                        style: withSizing(sizedTable(context), config.tableStyle),
                        'aria-busy': context.busy ? 'true' : undefined,
                        // With rows or columns left out of view, the table says how many it has.
                        'aria-rowcount': context.virtual ? String(context.virtual.rowCount) : undefined,
                        'aria-colcount': config.virtualColumns ? String(context.columns.length) : undefined
                    }
                ),
                config.caption ? h('caption', mergeAttrs({ key: 'caption', id: context.ids.caption }, part(config.showCaption ? 'caption' : 'hiddenCaption')), config.caption) : null,
                headView(context),
                bodyView(context),
                footView(context)
            )
        );
    return [
        headerBar(context),
        paginator && config.paginatorPosition === 'top' ? paginatorView(context) : null,
        // With a side bar, the table and the bar sit side by side; without one, the table is where it always was.
        context.sideBar ? h('div', mergeAttrs({ key: 'body-area' }, part('bodyArea')), tableArea, sideBarView(context)) : tableArea,
        paginator && config.paginatorPosition !== 'top' ? paginatorView(context) : null,
        footerBar(context),
        statusBar(context),
        loadingMask(context),
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
 * Once every column has a width — the first drag gives them all their
 * measured one — the table is laid out by those widths alone: fixed layout,
 * as wide as they add up to. Left to the automatic layout, the browser shares
 * any spare room out among the columns, and a column dragged to 240px drew at
 * whatever was left, the edge drifting away from the pointer.
 */
function sizedTable<T>(context: ViewContext<T>): Record<string, string> {
    if (!sized(context)) return {};
    const total = context.columns.reduce((sum, column) => sum + (column.width ?? 0), 0);
    // Never narrower than the grid: what the columns leave goes to the filler
    // column at the end, so the rows' stripes and rules still reach the edge.
    return { width: `${total}px`, 'min-width': '100%', 'table-layout': 'fixed' };
}

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
 * The empty column after the last, while the widths lay the table out: it
 * takes the room the columns do not, so no column is stretched past the width
 * it was given (its edge would leave the pointer) and every row — its stripe,
 * its rule — still runs to the grid's edge, as in a spreadsheet. Nothing to
 * read in it, so it is hidden from assistive technology.
 */
type CellLook = 'headerCell' | 'filterCell' | 'bodyCell' | 'footerCell';

function filler<T>(context: ViewContext<T>, tag: 'th' | 'td', look: CellLook, rowspan?: number): VElement[] {
    if (!sized(context)) return [];
    // Dressed as the row's other cells (ground, rules, stripes), emptied of padding.
    return [
        h(
            tag,
            mergeAttrs(
                {
                    key: '__filler',
                    role: 'presentation',
                    'aria-hidden': 'true',
                    rowspan: rowspan && rowspan > 1 ? String(rowspan) : undefined
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
function withFiller<T>(context: ViewContext<T>, cells: Child[], tag: 'th' | 'td', look: CellLook, rowspan?: number, at = fillerAt(context)): Child[] {
    const extra = filler(context, tag, look, rowspan);
    if (!extra.length) return cells;
    return at < 0 ? [...cells, ...extra] : [...cells.slice(0, at), ...extra, ...cells.slice(at)];
}

/** The empty cell that keeps the room of the columns left out of view. */
function spacerCell<T>(context: ViewContext<T>, spacer: ColumnSpacer, tag: 'th' | 'td', look: CellLook, rowspan?: number): VElement {
    return h(
        tag,
        mergeAttrs(
            {
                key: spacer.key,
                role: 'presentation',
                'aria-hidden': 'true',
                rowspan: rowspan && rowspan > 1 ? String(rowspan) : undefined
            },
            context.part(look, {}),
            context.part('fillerCell'),
            { style: { width: `${spacer.width}px` } }
        )
    );
}

/** One row's cells, column by column, with the spacers and the filler where they go. */
function cells<T>(context: ViewContext<T>, tag: 'th' | 'td', look: CellLook, draw: (column: ResolvedColumn<T>) => Child): Child[] {
    return withFiller(
        context,
        context.drawn.map((entry) => (isSpacer(entry) ? spacerCell(context, entry, tag, look) : draw(entry))),
        tag,
        look
    );
}

/** Where a cell stands among all the columns, said only when some are left out of view. */
const colIndex = <T>(context: ViewContext<T>, column: ResolvedColumn<T>) => (context.config.virtualColumns ? String(column.position) : undefined);

/** How many columns a cell spanning the row covers: the filler is one too. */
const span = <T>(context: ViewContext<T>) => String(Math.max(1, context.drawn.length) + (sized(context) ? 1 : 0));

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
    if (!config.columnToggle && own === null) return null;
    return h(
        'div',
        mergeAttrs({ key: 'header' }, part('header')),
        own,
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
        'thead',
        // On the head rather than a row: with groups, the columns' own headers are in several rows.
        mergeAttrs({ key: 'thead' }, part('thead'), {
            onDragover: context.on.dragOver,
            onDrop: context.on.drop
        }),
        depth
            ? groupedHeaderRows(context, depth)
            : h(
                  'tr',
                  mergeAttrs({ key: 'header-row' }, part('headerRow'), {
                      'aria-rowindex': headerRowIndex(context, 0)
                  }),
                  cells(context, 'th', 'headerCell', (column) => headerCell(context, column))
              ),
        filterRow
            ? h(
                  'tr',
                  mergeAttrs({ key: 'filter-row' }, part('filterRow'), {
                      'aria-rowindex': headerRowIndex(context, depth + 1)
                  }),
                  cells(context, 'td', 'filterCell', (column) =>
                      h(
                          'td',
                          mergeAttrs(
                              { key: column.key },
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
function headerCell<T>(context: ViewContext<T>, column: ResolvedColumn<T>, rowspan?: number): VElement {
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
    const tools = headerTools(context, column);
    // With buttons beside it, the title and the buttons share one line.
    const withTools = (main: Child) => (tools ? h('span', part('headerContent'), main, tools) : main);
    return h(
        'th',
        mergeAttrs(
            {
                key: column.key,
                scope: 'col',
                rowspan: rowspan && rowspan > 1 ? String(rowspan) : undefined
            },
            part('headerCell', {
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
                    ...(column.width ? { width: `${column.width}px`, 'min-width': `${column.width}px` } : {}),
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
                            h('span', mergeAttrs(part('sortIcon', { active: sortIndex >= 0 })), iconView(sortIcon)),
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
function headerTools<T>(context: ViewContext<T>, column: ResolvedColumn<T>): Child {
    const { config, part, locale, menus } = context;
    const filter = menus.filter && filtersByMenu(config, column);
    const menu = menus.column && offersMenu(config, column);
    if (!filter && !menu) return null;
    const active = filter && hasFilter(context.filters, column);
    const open = menus.open === column.key;
    return h(
        'span',
        part('headerTools'),
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
                          onClick: (event: MouseEvent) => context.on.openColumnMenu(column, event)
                      }
                  ),
                  iconView('moreVertical')
              )
            : null
    );
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
                            onChange: (event: Event) => context.on.filterTick(index, (event.target as HTMLInputElement).checked)
                        }),
                        h('span', null, entry.label)
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
    const tabs = h(
        'div',
        mergeAttrs(part('sideTabs'), { role: 'toolbar', 'aria-orientation': 'vertical', 'aria-label': words.sideBar }),
        side.panels.map((panel) =>
            h(
                'button',
                mergeAttrs({ key: panel, type: 'button' }, part('sideTab', { open: side.open === panel }), {
                    'aria-pressed': String(side.open === panel),
                    'aria-controls': side.open === panel ? panelId(panel) : undefined,
                    'data-side-tab': panel,
                    onClick: () => context.on.sideTab(panel)
                }),
                iconView(panel === 'columns' ? 'columns' : 'filter', part('sideTabIcon')),
                h('span', part('sideTabLabel'), panel === 'columns' ? words.columnsPanel : words.filtersPanel)
            )
        )
    );
    const columnsPanel = () => {
        const search = side.search.trim().toLocaleLowerCase(locale.code);
        const shown = side.columns.filter((entry) => !search || entry.header.toLocaleLowerCase(locale.code).includes(search));
        const visible = side.columns.filter((entry) => entry.visible).length;
        return [
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
                      'aria-label': side.open === 'columns' ? words.columnsPanel : words.filtersPanel
                  }),
                  h('h2', part('sidePanelTitle'), side.open === 'columns' ? words.columnsPanel : words.filtersPanel),
                  side.open === 'columns' ? columnsPanel() : filtersPanel()
              )
            : null,
        tabs
    ) as VElement;
}

/** A cell of a heading row: a group over a run of columns, a column's own header, or a spacer. */
type HeadEntry<T> = { kind: 'group'; group: ColumnGroupRef<T>; columns: ResolvedColumn<T>[] } | { kind: 'leaf'; column: ResolvedColumn<T> } | { kind: 'spacer'; spacer: ColumnSpacer };

/**
 * The head of a grid whose columns sit in groups: a row per level of groups,
 * then the columns' own. A group's heading spans the run of its columns drawn
 * side by side — split where a column of another group stands between them, or
 * where the pinned block ends, since one part of it stays and the other
 * scrolls. A column in fewer groups than the deepest has its header reach up
 * through the rows it has no group in, and so does a spacer, and the filler.
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
                if (level === 0) {
                    entries.push({ kind: 'spacer', spacer: entry });
                    from.push(at);
                }
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
            } else if (level === groups) {
                entries.push({ kind: 'leaf', column: entry });
                from.push(at);
            }
        });
        const cellsOf = entries.map((entry) =>
            entry.kind === 'spacer'
                ? spacerCell(context, entry.spacer, 'th', 'headerCell', depth + 1)
                : entry.kind === 'leaf'
                  ? headerCell(context, entry.column, depth + 1 - level)
                  : groupCell(context, entry.group, entry.columns)
        );
        const end = fillerAt(context);
        const at = end < 0 ? -1 : from.findIndex((column) => column >= end);
        rows.push(
            h(
                'tr',
                mergeAttrs({ key: `header-row-${level}` }, part(level === depth ? 'headerRow' : 'columnGroupRow'), { 'aria-rowindex': headerRowIndex(context, level) }),
                level === 0 ? withFiller(context, cellsOf, 'th', 'headerCell', depth + 1, at) : cellsOf
            )
        );
    }
    return rows;
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
        'th',
        mergeAttrs(
            {
                key: `${group.key}:${first.key}`,
                scope: 'colgroup',
                colspan: columns.length > 1 ? String(columns.length) : undefined
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
                style: { ...stickyStyle(anchor), ...group.column.headerStyle },
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

function bodyView<T>(context: ViewContext<T>): Child {
    const { config, part, locale, rows, virtual } = context;
    if (skeletonShown(context)) return skeletonBody(context);
    if (!rows.page.length) {
        return h(
            'tbody',
            mergeAttrs({ key: 'tbody' }, part('tbody')),
            h(
                'tr',
                part('emptyRow'),
                h('td', mergeAttrs(part('emptyCell'), { colspan: span(context) }), content(config.content?.empty?.()) ?? config.emptyMessage ?? locale.emptyMessage)
            )
        );
    }
    const start = virtual?.window.start ?? 0;
    const shown = virtual ? context.lines.slice(start, virtual.window.end) : context.lines;
    return h(
        'tbody',
        mergeAttrs({ key: 'tbody' }, part('tbody')),
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
            'tr',
            mergeAttrs({ key }, context.part('spacerRow'), {
                role: 'presentation',
                'aria-hidden': 'true',
                style: { height: `${px}px` }
            }),
            h('td', mergeAttrs(context.part('spacerCell'), { colspan: span(context) }))
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
        'tr',
        mergeAttrs({ key: `group-${line.group.key}` }, part('groupRow', { values: true }), {
            'data-line': String(at),
            'aria-rowindex': virtual ? String(virtual.rowIndex(at)) : undefined
        }),
        cells(context, 'td', 'bodyCell', (column) => {
            const value = column.column.aggregate ? aggregateOf(column.column, line.group.rows) : undefined;
            const shown = column.column.aggregate
                ? (content(column.column.aggregateContent?.({ value, rows: line.group.rows, column: column.column })) ?? cellText(value, context.locale.code))
                : null;
            const lead = column === first;
            return h(
                lead ? 'th' : 'td',
                mergeAttrs({ key: column.key }, part('groupCell', { level: line.level, lead, align: column.align, ...pinnedState(column) }), {
                    scope: lead ? 'row' : undefined,
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
const treeColumnOf = <T,>(columns: ResolvedColumn<T>[]) => columns.find((column) => !column.selectionMode && !column.column.expander && !column.column.rowEditor && !column.column.rowDrag)?.key;

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
            'tr',
            mergeAttrs({ key: `group-${line.group.key}` }, part('groupRow'), {
                'data-line': String(at),
                'aria-rowindex': rowIndex
            }),
            h(
                'th',
                mergeAttrs(part('groupCell', { level: line.level }), {
                    colspan: span(context),
                    scope: 'colgroup',
                    style: line.level ? { '--vt-datagrid-group-level': String(line.level) } : undefined
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
    const main = h(
        'tr',
        mergeAttrs({ key }, part('row', { selectable, selected, expanded, dragging: drag?.index === index, dropBefore: dropHere && !drag.after, dropAfter: dropHere && drag.after }), {
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
        cells(context, 'td', 'bodyCell', (column) => {
            const open = !!context.editing && context.editing.index === index && context.editing.keys.includes(column.key);
            const focus = context.cellFocus;
            return h(
                'td',
                mergeAttrs(
                    { key: column.key },
                    part('bodyCell', {
                        align: column.align,
                        ...pinnedState(column),
                        editing: open,
                        editable: isEditable(column.column, row),
                        ...rangeState(context, index, column.key)
                    }),
                    column.selectionMode ? part('selectionCell') : {},
                    {
                        style: { ...stickyStyle(column), ...column.column.bodyStyle },
                        class: column.column.bodyClass,
                        'aria-colindex': colIndex(context, column),
                        'data-col': column.key,
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
            'tr',
            mergeAttrs({ key: `${key}-detail`, id: detailId }, part('expansionRow'), {
                'data-line': String(at),
                'aria-rowindex': virtual ? String(virtual.rowIndex(at) + 1) : undefined
            }),
            h('td', mergeAttrs(part('expansionCell'), { colspan: span(context) }), content(config.content!.rowExpansion!({ row, index: rows.offset + index })))
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
    const value = valueOf(row, column);
    return (
        content(
            column.column.body?.({
                row,
                index,
                field: column.field,
                value,
                column: column.column,
                pinned
            })
        ) ?? cellText(value, context.locale.code)
    );
}

/** Where a cell stands in the marked block: in it, on which of its edges, or under a fill. */
function rangeState<T>(context: ViewContext<T>, index: number, key: string) {
    const range = context.range;
    if (!range) return {};
    const { box, fill } = range;
    const inRange = box.rows.includes(index) && box.keys.includes(key);
    const filling = !!fill && fill.rows.includes(index) && fill.keys.includes(key);
    // A fill grows the block's outline over the cells it would write.
    const rows = fill && fill.keys === box.keys ? [...box.rows, ...fill.rows] : box.rows;
    const keys = fill && fill.rows === box.rows ? [...box.keys, ...fill.keys] : box.keys;
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
    return h(
        'tr',
        mergeAttrs({ key: `pinned-${position}-${index}` }, part('row', {}), part('pinnedRow', { position }), {
            class: context.config.rowClass?.(row),
            style: fixedHeight(context),
            'aria-rowindex': context.virtual ? String(position === 'top' ? before + index + 1 : context.virtual.rowCount - context.pinnedBottom.length - footRows(context) + index + 1) : undefined
        }),
        cells(context, 'td', 'bodyCell', (column) =>
            h(
                'td',
                mergeAttrs({ key: column.key }, part('bodyCell', { align: column.align, ...pinnedState(column) }), part('pinnedRowCell'), {
                    style: { ...stickyStyle(column), ...column.column.bodyStyle },
                    class: column.column.bodyClass,
                    'aria-colindex': colIndex(context, column)
                }),
                column.selectionMode || column.column.expander ? null : cellContent(context, column, row, index, position)
            )
        )
    );
}

/** Whether the columns write a footer row. */
const hasFooter = <T>(context: ViewContext<T>) => context.columns.some((column) => column.column.footer !== undefined || column.column.footerContent);
const footRows = <T>(context: ViewContext<T>) => (hasFooter(context) ? 1 : 0);

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
        'tbody',
        mergeAttrs({ key: 'tbody' }, part('tbody')),
        Array.from({ length: skeletonCount(context) }, (_, index) =>
            h(
                'tr',
                mergeAttrs({ key: `skeleton-${index}` }, part('row', { skeleton: true }), { 'aria-hidden': 'true', style: fixedHeight(context) }),
                cells(context, 'td', 'bodyCell', (column) =>
                    h(
                        'td',
                        mergeAttrs({ key: column.key }, part('bodyCell', { align: column.align, ...pinnedState(column) }), column.selectionMode ? part('selectionCell') : {}, {
                            style: { ...stickyStyle(column), ...column.column.bodyStyle },
                            class: column.column.bodyClass
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
    if (!footer && !context.pinnedBottom.length) return null;
    return h(
        'tfoot',
        // Held at the bottom of the box while the rows scroll, when it holds rows pinned there.
        mergeAttrs({ key: 'tfoot' }, part('tfoot', { sticky: context.pinnedBottom.length > 0 })),
        context.pinnedBottom.map((row, index) => pinnedRowView(context, row, index, 'bottom')),
        footer
            ? h(
                  'tr',
                  mergeAttrs({ key: 'footer-row' }, part('footerRow'), {
                      'aria-rowindex': context.virtual ? String(context.virtual.rowCount) : undefined
                  }),
                  cells(context, 'td', 'footerCell', (column) =>
                      h(
                          'td',
                          mergeAttrs(
                              { key: column.key },
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

const valueOf = <T,>(row: T, column: ResolvedColumn<T>): unknown => (column.field ? getField(row, column.field) : undefined);
