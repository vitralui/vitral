import {
    clampFirst,
    dropTarget,
    en,
    formatMessage,
    normalizeText,
    layoutFor,
    loadStyle,
    moveColumn,
    pageCount,
    pageOf,
    pinColumn,
    resizeColumn,
    selectRows,
    tableBus,
    toggleColumn,
    toggleSelection,
    toggleSort,
    type ColumnLayout,
    type FilterConstraint,
    type FilterMeta,
    type Locale
} from '@vitral/core';
import { createMenu, createOverlay, createSelect, type MenuItem, type SelectHandle } from '@vitral/controls';
import { createRoot, partResolver, scrollbarSlot } from '@vitral/dom';
import { columns as columnsIcon, pin, registerIcons } from '@vitral/icons';
import { baseStyle, datagridStyle, paginatorStyle, scrollpanelStyle } from '@vitral/styles';
import {
    allSelectedState,
    declaredColumns,
    defaultModels,
    hasActiveFilter,
    isComposite,
    expansionKey,
    isExpanded,
    loadRequest,
    modeOf,
    linesOf,
    pinnedRowsOf,
    resolveRows,
    rowKey,
    rowSelected,
    selectionKind,
    sortsOf,
    tableColumns,
    tableLayout,
    type ResolvedColumn,
    treeKey,
    type ResolvedRows
} from './engine/state';
import { offsetsOf, windowOf, type VirtualWindow } from './engine/virtual';
import { cellValue, createEditHistory, editorKind, editorText, isEditable, parseEdit, validateEdit, writeCell, type EditRecord } from './engine/edit';
import type { Content, Row, RowsPerPageContext, DataGridColumn, DataGridConfig, DataGridModels, GridMenuItem, StatusContext } from './engine/types';
import { toCSV, type DataGridCsvOptions } from './engine/export';
import { childrenOf, groupFields, groupKeys, treeKeys } from './engine/rows';
import { fillSeries, parseClipboard, rangeBox, rangeStats, toClipboard, type CellRef, type RangeBox } from './engine/range';
import { toXlsx, type DataGridXlsxOptions } from './engine/xlsx';
import { pivotOf, PIVOT_KEY } from './engine/pivot';
import { distinctValues, filterKind, filterText as filterBoxText, filterValue as readFilterValue, fromPanel, matchModesFor, panelFilter, type FilterKind } from './engine/filters';
import { type SideBarView, type SidePanel } from './render/grid';
import { chooserView, filterPanelView, filtersByMenu, frameRows, gridView, offersMenu, type FilterPanelView, type DataGridActions, type DrawnColumn, type EditingView, type ViewContext, type VirtualRows } from './render/grid';

/**
 * A data table with no framework in it: it is handed a configuration, it draws
 * a real `<table>` into the element it is given, and it reports what the
 * reader did. The Vue, React and Angular components wrap this; so can a page
 * with no framework at all.
 *
 * Everything the reader can change — the page, the sort, the filters, the
 * selection, the column layout — is state the table keeps and publishes, so a
 * host can bind it, store it and hand it back.
 */

export interface DataGridHandle<T = Row> {
    /** Changes part of the configuration; what did not change is not redrawn. */
    update(config: Partial<DataGridConfig<T>>): void;
    /** The models as they stand: the page, the sort, the filters, the selection, the layout. */
    state(): DataGridModels;
    /** Draws again, for data that changed underneath. */
    refresh(): void;
    /** Asks the data source again, for rows that changed where they came from. */
    reload(): void;
    /**
     * Scrolls the grid until a row is in view: by its place among the rows on
     * show (on the page, with a paginator), sorted and filtered. In a virtual
     * grid this is how to reach a row that is not drawn yet.
     */
    scrollToIndex(index: number): void;
    /** Opens a cell's editor (in `editMode: 'row'`, its row's), by the row's place among the rows on show and the column's key. */
    startEdit(index: number, key: string): void;
    /** Closes the editors: keeping what was typed, if it passes, or with `cancel`, dropping it. Whether they closed. */
    stopEdit(cancel?: boolean): boolean;
    /** Puts the keyboard on a cell, scrolling it into view. */
    focusCell(index: number, key: string): void;
    /** Marks the block of cells from one to another, by row index among the rows on show and column key. */
    selectRange(anchor: CellRef, focus?: CellRef): void;
    clearRange(): void;
    /** The block marked, its rows by index among every row, and the values in it. */
    getRange(): { rows: number[]; keys: string[]; values: unknown[][] } | null;
    /** The rows as the bytes of an Excel workbook, with numbers, dates and booleans kept as such. */
    toXlsx(options?: DataGridXlsxOptions & { scope?: DataGridExportOptions['scope'] }): Uint8Array;
    /** Downloads the rows as an Excel workbook. */
    exportExcel(options?: DataGridXlsxOptions & { scope?: DataGridExportOptions['scope']; filename?: string }): void;
    /** Opens every group, or every row of a tree that holds rows; and shuts them all. */
    expandAll(): void;
    collapseAll(): void;
    /** Undoes the last edit, or does the last undone one again. */
    undo(): void;
    redo(): void;
    /**
     * The table as CSV, in the columns and order on show. `scope` is every row
     * the filters let through (the default), the page on show, or the
     * selection; with a data source or `lazy`, "every row" is the rows loaded.
     */
    toCSV(options?: DataGridExportOptions): string;
    /** Hands the reader the CSV as a file to save, `table.csv` unless `filename` says otherwise. */
    exportCSV(options?: DataGridExportOptions & { filename?: string }): void;
    /** Removes everything this table added to the element. */
    destroy(): void;
    readonly element: HTMLElement;
}

export interface DataGridExportOptions extends DataGridCsvOptions {
    scope?: 'all' | 'page' | 'selection';
    /** Start the file with a byte-order mark, which is what makes Excel read UTF-8. Defaults to true for `exportCSV`. */
    bom?: boolean;
}

let counter = 0;

export function createDataGrid<T = Row>(element: HTMLElement, config: DataGridConfig<T> = {}): DataGridHandle<T> {
    // The menus and the side bar name their icons; the ones the base set lacks are made known.
    registerIcons([pin, columnsIcon]);
    // What the host handed in, and what the grid works from: the same, or its pivot.
    let own: DataGridConfig<T> = { ...config };
    let current: DataGridConfig<T> = pivoted(own);
    let models: DataGridModels = { ...defaultModels(), ...pickModels(config) };
    /** The filters the rows are computed from: at once for local data, after `filterDelay` for a server. */
    let applied: FilterMeta = cloneFilters(models.filters);
    let remote: { items: T[]; total: number } | undefined;
    let chooserOpen = false;
    let chooserEl: HTMLElement | null = null;
    // The filter panel and the menus: the column they are open for, and what the panel holds.
    let menuKey: string | null = null;
    // A row being dragged by its handle, and where it would land.
    let rowDrag: { index: number; over: number | null; after: boolean } | null = null;
    // The block of cells marked, from the cell it started at to the one it reaches; and the cells a fill would write.
    let range: { anchor: CellRef; focus: CellRef; box: RangeBox } | null = null;
    let fillTo: RangeBox | null = null;
    let stopPointer: (() => void) | null = null;
    // What each cell on show last held, for a cell that changes to flash.
    const seen = new Map<string, unknown>();
    let flashed = 0;
    // What the cells marked as a range add up to, once ranges can be marked.
    const rangeTotals = (): StatusContext<T>['range'] => (range && boxSize(range.box) > 1 ? rangeStats(boxValues(range.box).flat()) : undefined);
    // The row whose handle keeps the keyboard once the host has put it in its new place.
    let movedRow: T | null = null;
    let draft: FilterDraft | null = null;
    // The side bar: the panel open, the columns panel's search, a column of its list being dragged.
    let sidePanel: SidePanel | null = config.sideBarOpen ?? null;
    let sideSearch = '';
    let sideDragging: string | null = null;
    let sideDropOn: string | null = null;
    const modeHosts: HTMLElement[] = [];
    const modeSelects: (SelectHandle | undefined)[] = [];
    /** The context the last draw produced, which the column list draws from. */
    let drawn: ViewContext<T> | null = null;
    let pageSizeHost: HTMLElement | null = null;
    let pageSize: SelectHandle | null = null;
    let dragging: string | null = null;
    let dropOn: string | null = null;
    /** The column whose edge is being dragged. */
    let resizing: string | null = null;
    let activeRow = 0;
    let filterTimer: ReturnType<typeof setTimeout> | undefined;
    let sourceRun = 0;
    let sourceLoading = false;
    let shared: ColumnLayout | null = null;
    let echo = false;
    let stopGroup: (() => void) | null = null;
    /** The box the table scrolls in, as last drawn. */
    let container: HTMLElement | null = null;
    let watcher: ResizeObserver | null = null;
    /** Where the box is scrolled to, and how much of it shows: what a virtual grid draws from. */
    let scrollTop = 0;
    let scrollLeft = 0;
    let viewHeight = 0;
    let viewWidth = 0;
    /** The height each line was drawn at, by its key, once it has been drawn: rows keep their own heights. */
    const heights = new Map<unknown, number>();
    let heightsVersion = 0;
    /** The height a line not drawn yet is taken to have: the first ones drawn, on average. */
    let estimate = 0;
    /** Which rows and columns the last draw covered, so a scroll that stays inside them draws nothing. */
    let drawnWindow = '';
    let scrollFrame = 0;
    /** The cell the keyboard is on, when it moves through cells. */
    let cellAt: { index: number; key: string } | null = null;
    /** The cells open for editing, and the row they belong to. */
    let editing: (EditingView & { rowData: T; originals: Record<string, unknown> }) | null = null;
    /** The editor to focus once it is drawn, and whether to select its text. */
    let focusEditor: { key: string; select: boolean } | null = null;
    let announcement = '';
    const history = createEditHistory<T>();

    const id = config.id ?? `vt-table-${++counter}`;
    const ids = { table: `${id}-table`, list: `${id}-columns`, caption: `${id}-caption` };
    const root = createRoot(element);

    const locale = (): Locale => current.locale ?? en;
    const part = partResolver({
        style: datagridStyle,
        unstyled: () => !!current.unstyled,
        classes: () => current.classes,
        pt: () => current.pt,
        props: () => current as Record<string, unknown>
    });

    /**
     * The paginator keeps its own parts, as it does in the framework
     * components: there it is a Paginator the table draws, so its buttons
     * carry the paginator's classes and only its root also carries the
     * table's `paginator` part.
     */
    const pagePart = partResolver({
        style: paginatorStyle,
        unstyled: () => !!current.unstyled,
        props: () => current as Record<string, unknown>
    });

    const styleOptions = () => ({ nonce: current.nonce, cssLayer: current.cssLayer });

    // The drawn scrollbars wear the ScrollPanel's classes, so one theme dresses every bar.
    const barOptions = () => ({ mode: current.scrollbar, arrows: current.scrollbarArrows, style: scrollpanelStyle, unstyled: current.unstyled, ...styleOptions() });
    const tableBars = scrollbarSlot(barOptions);
    const chooserBars = scrollbarSlot(barOptions);

    if (!config.unstyled) {
        // The shared rules too: the table's own icons, fields and screen-reader
        // text are the ones every Vitral control uses.
        loadStyle(baseStyle.name, baseStyle.css, styleOptions());
        loadStyle(datagridStyle.name, datagridStyle.css, styleOptions());
        if (config.paginator) loadStyle(paginatorStyle.name, paginatorStyle.css, styleOptions());
    }

    // ---- what the host hears ------------------------------------------------------

    function emit<K extends keyof NonNullable<DataGridConfig<T>['on']>>(name: K, payload: Parameters<NonNullable<NonNullable<DataGridConfig<T>['on']>[K]>>[0]) {
        const handler = current.on?.[name] as ((value: unknown) => void) | undefined;
        handler?.(payload);
    }

    /** Every change to a model is published, so a host can bind them. */
    function change(next: Partial<DataGridModels>) {
        models = { ...models, ...next };
        current.on?.change?.({ ...models });
        render();
    }

    // ---- the rows -----------------------------------------------------------------

    const mode = () => modeOf(current);

    /**
     * The rows, sorted, filtered and paged, worked out again only when
     * something they come from has changed: a virtual grid draws on every
     * scroll, and sorting a hundred thousand rows each time would be felt.
     */
    let rowsMemo: { inputs: unknown[]; rows: ResolvedRows<T> } | null = null;
    function rowsNow(): ResolvedRows<T> {
        const inputs = [
            current.value,
            current.dataSource,
            current.lazy,
            current.totalRecords,
            current.paginator,
            current.sortMode,
            current.globalFilterFields,
            current.locale,
            models.first,
            models.rows,
            models.sortField,
            models.sortOrder,
            models.multiSortMeta,
            applied,
            remote,
            current.treeData,
            models.expandedTree
        ];
        if (rowsMemo && rowsMemo.inputs.every((value, index) => value === inputs[index])) return rowsMemo.rows;
        const rows = resolveRows(current, models, applied, remote);
        rowsMemo = { inputs, rows };
        return rows;
    }

    function requestSource() {
        const source = current.dataSource;
        if (!source) return;
        const run = ++sourceRun;
        const request = loadRequest(current, models, applied);
        sourceLoading = true;
        void Promise.resolve(source.load(request)).then(
            (answer) => {
                // A slow answer that arrives after a newer one is thrown away.
                if (run !== sourceRun) return;
                sourceLoading = false;
                remote = answer as { items: T[]; total: number };
                if (!clampPage()) render();
            },
            () => {
                if (run !== sourceRun) return;
                sourceLoading = false;
                render();
            }
        );
        render();
    }

    /**
     * When the rows shrink under the page being read — a filter, a delete, a
     * smaller answer — the table moves to the last page there is. Answers with
     * nothing in them are left alone: a lazy table reports a total of 0 before
     * its first page arrives.
     */
    function clampPage(): boolean {
        if (!current.paginator) return false;
        const total = rowsNow().total;
        if (!(total > 0)) return false;
        const first = clampFirst(models.first, models.rows, total);
        if (first >= models.first) return false;
        change({ first });
        emit('page', { first, rows: models.rows, page: pageOf(first, models.rows), pageCount: pageCount(total, models.rows) });
        return true;
    }

    function requestRows() {
        if (mode() === 'source') requestSource();
        else if (mode() === 'lazy') emit('lazy-load', loadRequest(current, models, applied));
    }

    function applyFilters(next: FilterMeta) {
        clearTimeout(filterTimer);
        const run = () => {
            applied = cloneFilters(next);
            if (current.paginator) models = { ...models, first: 0 };
            const rows = rowsNow();
            emit('filter', { filters: cloneFilters(next), filteredValue: mode() === 'local' ? rows.all : rows.page });
            requestRows();
            render();
        };
        const delay = current.filterDelay ?? 300;
        if (mode() !== 'local' && delay > 0) filterTimer = setTimeout(run, delay);
        else run();
    }

    // ---- what the reader does ------------------------------------------------------

    const actions: DataGridActions<T> = {
        sort(column, event) {
            const multiple = current.sortMode === 'multiple';
            const next = toggleSort(sortsOf(current, models), column.sortField, { multiple, additive: event.ctrlKey || event.metaKey, removable: current.removableSort });
            const models_: Partial<DataGridModels> = multiple
                ? { multiSortMeta: next }
                : { sortField: next[0]?.field ?? null, sortOrder: next[0]?.order ?? null, multiSortMeta: next };
            if (current.paginator) models_.first = 0;
            change(models_);
            emit('sort', { originalEvent: event, sortField: next[0]?.field ?? null, sortOrder: next[0]?.order ?? null, multiSortMeta: next });
            requestRows();
        },
        setFilter(column, value) {
            const existing = models.filters[column.filterField];
            const entry =
                existing && isComposite(existing)
                    ? { ...existing, constraints: [{ ...existing.constraints[0], value }, ...existing.constraints.slice(1)] }
                    : { matchMode: column.column.filterMatchMode, ...existing, value };
            const filters = { ...models.filters, [column.filterField]: entry } as FilterMeta;
            models = { ...models, filters };
            current.on?.change?.({ ...models });
            applyFilters(filters);
        },
        page(first, rows) {
            const total = rowsNow().total;
            const next = clampFirst(first, rows, total);
            change({ first: next, rows });
            emit('page', { first: next, rows, page: pageOf(next, rows), pageCount: pageCount(total, rows) });
            requestRows();
        },
        // A new page size keeps the first row on screen, rather than jumping back to page one.
        pageSize(size) {
            if (!(size > 0) || size === models.rows) return;
            const total = rowsNow().total;
            const first = pageOf(models.first, size) * size;
            change({ first, rows: size });
            emit('page', { first, rows: size, page: pageOf(first, size), pageCount: pageCount(total, size) });
            requestRows();
        },
        toggleRow(row, index, event, type) {
            const kind = selectionKind(current, columnsNow());
            if (!kind) return;
            const was = rowSelected(current, models, kind, row);
            change({ selection: toggleSelection(models.selection, row, kind, current.dataKey) });
            emit(was ? 'row-unselect' : 'row-select', { originalEvent: event, data: row, index, type });
        },
        toggleAll(event) {
            const rows = rowsNow();
            const cover = mode() === 'local' ? rows.all : rows.page;
            const select = allSelectedState(current, models, cover) !== 'all';
            change({ selection: selectRows(models.selection, cover, select, current.dataKey) });
            emit(select ? 'row-select-all' : 'row-unselect-all', { originalEvent: event, data: cover });
        },
        rowClick(row, index, event) {
            const rows = rowsNow();
            emit('row-click', { originalEvent: event, data: row, index: rows.offset + index });
            if (!current.selectionMode) return;
            // A press on a control inside a cell is that control's, not the row's.
            if ((event.target as Element).closest('button, input, select, textarea, a, [role="button"]')) return;
            actions.toggleRow(row, rows.offset + index, event, 'row');
        },
        rowKeydown(event, index) {
            if (!current.selectionMode || event.target !== event.currentTarget) return;
            const rows = rowsNow();
            const last = rows.page.length - 1;
            const go = (to: number) => {
                event.preventDefault();
                activeRow = Math.max(0, Math.min(last, to));
                // In a virtual grid the row may not be drawn yet: bring it into view first.
                scrollToIndex(activeRow);
                (element.querySelector(`tbody tr[data-index="${activeRow}"]`) as HTMLElement | null)?.focus({ preventScroll: !!current.virtualScroll });
            };
            switch (event.key) {
                case 'ArrowDown':
                    return go(index + 1);
                case 'ArrowUp':
                    return go(index - 1);
                case 'Home':
                    return go(0);
                case 'End':
                    return go(last);
                // In a tree, right opens a row's rows and left shuts them, as in any tree.
                case 'ArrowRight':
                case 'ArrowLeft': {
                    const row = rows.page[index];
                    const place = row === undefined ? undefined : rows.tree?.get(row);
                    if (!place?.hasChildren || place.expanded === (event.key === 'ArrowRight')) return;
                    event.preventDefault();
                    return actions.toggleTree(row!, place.key, event);
                }
                case ' ':
                case 'Enter': {
                    event.preventDefault();
                    const row = rows.page[index];
                    if (row !== undefined) actions.toggleRow(row, rows.offset + index, event, 'row');
                    return;
                }
            }
        },
        resizeStart(column, event) {
            const start = measured();
            const next = columnAfter(column);
            const from = event.clientX;
            const rtl = getComputedStyle(element).direction === 'rtl';
            // Every column gets its measured width first: from here the table
            // is laid out by the widths alone, so the edge stays under the pointer.
            const base: ColumnLayout = { ...tableLayout(current, withShared()), widths: { ...start, ...tableLayout(current, withShared()).widths } };
            writeLayout(base);
            resizing = column.key;
            document.documentElement.classList.add('vt-column-resizing');
            render();
            // The width follows the distance from where the drag began, not the
            // sum of each step: a step lost against the minimum would leave the
            // edge behind the pointer for the rest of the drag.
            let pending: PointerEvent | null = null;
            let frame = 0;
            const flush = () => {
                frame = 0;
                if (!pending) return;
                const moved = pending;
                pending = null;
                applyResize(column, (moved.clientX - from) * (rtl ? -1 : 1), next, start, moved, base);
            };
            const move = (moved: PointerEvent) => {
                pending = moved;
                // One layout a frame: a pointer reports faster than the screen draws.
                frame ||= requestAnimationFrame(flush);
            };
            const stop = () => {
                if (frame) cancelAnimationFrame(frame);
                flush();
                resizing = null;
                document.documentElement.classList.remove('vt-column-resizing');
                document.removeEventListener('pointermove', move);
                document.removeEventListener('pointerup', stop);
                document.removeEventListener('pointercancel', stop);
                render();
            };
            // From the document: a capture on the header is dropped when the
            // header is redrawn, which is every step of the drag.
            document.addEventListener('pointermove', move);
            document.addEventListener('pointerup', stop);
            document.addEventListener('pointercancel', stop);
            event.preventDefault();
        },
        resizeKey(column, event) {
            const step = event.shiftKey ? 48 : 16;
            const delta = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0;
            if (!delta) return;
            event.preventDefault();
            const rtl = getComputedStyle(element).direction === 'rtl';
            applyResize(column, delta * (rtl ? -1 : 1), columnAfter(column), measured(), event);
        },
        headerKeydown(column, event) {
            if (!current.reorderableColumns || column.selectionMode || !(event.ctrlKey || event.metaKey)) return;
            const rtl = getComputedStyle(element).direction === 'rtl';
            const back = event.key === (rtl ? 'ArrowRight' : 'ArrowLeft');
            const forward = event.key === (rtl ? 'ArrowLeft' : 'ArrowRight');
            if (!back && !forward) return;
            event.preventDefault();
            const order = columnsNow().map((entry) => entry.key);
            const at = order.indexOf(column.key);
            if ((back && at === 0) || (forward && at >= order.length - 1)) return;
            move(column.key, (back ? order[at - 1] : order[at + 2]) ?? null, event);
            requestAnimationFrame(() => (element.querySelector(`[data-column="${cssEscape(column.key)}"]`) as HTMLElement | null)?.focus());
        },
        dragStart(column, event) {
            if (!current.reorderableColumns || column.selectionMode) return;
            dragging = column.key;
            event.dataTransfer?.setData('text/plain', column.key);
            if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
        },
        dragOver(event) {
            if (!dragging) return;
            event.preventDefault();
            // The columns drawn: one left out of view is no place to drop.
            const edges = columnsNow().flatMap((column) => {
                const rect = headerOf(column.key)?.getBoundingClientRect();
                return rect ? [{ key: column.key, left: rect.left, right: rect.right }] : [];
            });
            const next = dropTarget(edges, event.clientX);
            if (next !== dropOn) {
                dropOn = next;
                render();
            }
        },
        drop(event) {
            const key = dragging;
            const before = dropOn;
            dragging = null;
            dropOn = null;
            if (!key) return;
            event.preventDefault();
            move(key, before, event);
        },
        dragEnd() {
            dragging = null;
            dropOn = null;
            render();
        },
        pin(column, side, event) {
            const layout = { ...tableLayout(current, withShared()), widths: { ...measured(), ...tableLayout(current, withShared()).widths } };
            const next = pinColumn(layout, column.key, side);
            writeLayout(next);
            emit('column-pin', { originalEvent: event, key: column.key, side, layout: next });
        },
        setVisible(key, visible, event) {
            const next = toggleColumn(tableLayout(current, withShared()), key, visible);
            writeLayout(next);
            emit('column-toggle', { originalEvent: event, key, visible, layout: next });
        },
        toggleChooser() {
            setChooser(!chooserOpen);
        },
        chooserButton(el) {
            chooserEl = el as HTMLElement | null;
        },
        scroller(el) {
            tableBars.ref(el);
            watch(el as HTMLElement | null);
        },
        chooserScroller: chooserBars.ref,
        toggleGroup(key) {
            const shut = models.collapsedGroups ?? [];
            change({ collapsedGroups: shut.includes(key) ? shut.filter((k) => k !== key) : [...shut, key] });
        },
        toggleExpansion(key) {
            const open = models.expandedRows ?? [];
            change({ expandedRows: isExpanded(open, key) ? open.filter((k) => String(k) !== String(key)) : [...open, key] });
        },
        openFilter(column, event) {
            if (draft?.key === column.key) return filterOverlay.close('request');
            openFilter(column, event.currentTarget as HTMLElement);
        },
        openColumnMenu(column, event) {
            if (columnMenu.isOpen && menuKey === column.key) return columnMenu.close();
            closeMenus();
            menuKey = column.key;
            columnMenu.update({ ...menuSettings(), items: menuItems(columnItems(column), (items) => (typeof current.columnMenu === 'function' ? current.columnMenu({ column: column.column, key: column.key, items }) : items)), ariaLabel: formatMessage(locale().datagrid.columnMenu, { column: column.header }) });
            render();
            columnMenu.open(event.currentTarget as HTMLElement);
        },
        filterText(at, text) {
            if (!draft || draft.kind === 'set') return;
            draft.texts[at] = text;
            applyDraft();
        },
        filterOperator(operator) {
            if (!draft) return;
            draft.operator = operator;
            applyDraft();
        },
        filterSearch(text) {
            if (!draft) return;
            draft.search = text;
            render();
        },
        filterTick(index, checked) {
            const at = draft?.shown[index];
            if (!draft || at === undefined) return;
            if (checked) draft.checked.add(at);
            else draft.checked.delete(at);
            applyDraft();
        },
        // Select-all ticks what the search found, or every value while there is no search.
        filterAll(checked) {
            if (!draft) return;
            for (const at of matching(draft)) {
                if (checked) draft.checked.add(at);
                else draft.checked.delete(at);
            }
            applyDraft();
        },
        clearFilter() {
            if (!draft) return;
            const column = columnByKey(draft.key);
            draft.texts = ['', ''];
            draft.search = '';
            draft.operator = 'and';
            draft.matchModes = [draft.modes[0]!, draft.modes[0]!];
            draft.checked = new Set(draft.options.map((_, at) => at));
            if (column) writeFilter(column.filterField, undefined);
            render();
            ((draft.inline ? element : filterOverlay.element())?.querySelector('[data-filter-value="0"], [data-filter-search]') as HTMLElement | null)?.focus();
        },
        gridContextmenu(event) {
            const target = event.target as Element;
            if (target.closest('[data-editing]')) return;
            const row = target.closest('tr[data-index]') as HTMLElement | null;
            if (!row || !element.contains(row)) return;
            const at = cellOf(target) ?? { index: Number(row.dataset.index), key: columnsNow()[0]?.key ?? '' };
            const cell = cellNode(at.index, at.key);
            if (!cell) return;
            event.preventDefault();
            openCellMenu(at, cell);
        },
        sideTab(panel) {
            sidePanel = sidePanel === panel ? null : panel;
            if (draft?.inline) draft = null;
            render();
            // The panel opened takes the keyboard: its search, or its first section.
            if (sidePanel) (element.querySelector('[data-side-search], [data-side-filter]') as HTMLElement | null)?.focus();
        },
        sideSearch(text) {
            sideSearch = text;
            render();
        },
        sideAll(visible, event) {
            const layout = tableLayout(current, withShared());
            const keys = sideColumns().map((entry) => entry.key);
            // Every column can be shown; hiding them all keeps the first, as a grid with no columns says nothing.
            const hidden = visible ? (layout.hidden ?? []).filter((key) => !keys.includes(key)) : [...new Set([...(layout.hidden ?? []), ...keys.slice(1)])];
            const next = { ...layout, hidden };
            writeLayout(next);
            emit('column-toggle', { originalEvent: event, key: keys[0] ?? '', visible, layout: next });
        },
        sideMoveKey(key, event) {
            if (!(event.ctrlKey || event.metaKey) || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return;
            event.preventDefault();
            const keys = sideColumns().map((entry) => entry.key);
            const at = keys.indexOf(key);
            const before = event.key === 'ArrowUp' ? keys[at - 1] : keys[at + 2] ?? null;
            if (before === undefined || (event.key === 'ArrowDown' && at === keys.length - 1)) return;
            move(key, before, event);
            requestAnimationFrame(() => (element.querySelector(`[data-side-column="${cssEscape(key)}"] [role="button"]`) as HTMLElement | null)?.focus());
        },
        sideDragStart(key, event) {
            sideDragging = key;
            event.dataTransfer?.setData('text/plain', key);
            if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
            render();
        },
        sideDragOver(key, event) {
            if (!sideDragging) return;
            event.preventDefault();
            if (sideDropOn === key) return;
            sideDropOn = key;
            render();
        },
        sideDrop(event) {
            const key = sideDragging;
            const before = sideDropOn;
            sideDragging = null;
            sideDropOn = null;
            if (!key || !before || key === before) return render();
            event.preventDefault();
            move(key, before, event);
        },
        sideDragEnd() {
            if (!sideDragging) return;
            sideDragging = null;
            sideDropOn = null;
            render();
        },
        sideFilter(key) {
            if (draft?.inline && draft.key === key) {
                draft = null;
                return render();
            }
            const column = columnByKey(key) ?? tableColumns(current, withShared()).find((entry) => entry.key === key);
            if (column) openFilter(column, null, true);
        },
        clearAllFilters() {
            const kept = Object.fromEntries(Object.entries(models.filters).filter(([field]) => !sideFilterColumns().some((column) => column.filterField === field)));
            if (draft) {
                draft.texts = ['', ''];
                draft.search = '';
                draft.checked = new Set(draft.options.map((_, at) => at));
            }
            models = { ...models, filters: kept };
            current.on?.change?.({ ...models });
            applyFilters(kept);
        },
        toggleTree(row, key, event) {
            const open = models.expandedTree ?? [];
            const expanded = !isExpanded(open, key);
            change({ expandedTree: expanded ? [...open, key] : open.filter((k) => String(k) !== String(key)) });
            emit('tree-toggle', { originalEvent: event, row, key, expanded });
        },
        rowDragStart(index, event) {
            rowDrag = { index, over: null, after: false };
            event.dataTransfer?.setData('text/plain', String(index));
            if (event.dataTransfer) {
                event.dataTransfer.effectAllowed = 'move';
                // The whole row goes with the pointer, not just its handle.
                const tr = (event.target as Element).closest('tr');
                if (tr) event.dataTransfer.setDragImage?.(tr, 16, 16);
            }
            render();
        },
        rowDragOver(event) {
            if (!rowDrag) return;
            const tr = (event.target as Element).closest?.('tbody tr[data-index]') as HTMLElement | null;
            if (!tr) return;
            event.preventDefault();
            if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
            const rect = tr.getBoundingClientRect();
            const over = Number(tr.dataset.index);
            const after = event.clientY > rect.top + rect.height / 2;
            if (over === rowDrag.over && after === rowDrag.after) return;
            rowDrag = { ...rowDrag, over, after };
            render();
        },
        rowDrop(event) {
            const drag = rowDrag;
            rowDrag = null;
            if (!drag || drag.over === null) return render();
            event.preventDefault();
            moveRow(drag.index, drag.over, drag.after, event);
        },
        rowDragEnd() {
            if (!rowDrag) return;
            rowDrag = null;
            render();
        },
        rowMoveKey(index, event) {
            if (!(event.ctrlKey || event.metaKey) || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return;
            event.preventDefault();
            event.stopPropagation();
            const rows = walkable();
            const at = rows.indexOf(index);
            const to = rows[at + (event.key === 'ArrowUp' ? -1 : 1)];
            if (to === undefined) return;
            moveRow(index, to, event.key === 'ArrowDown', event);
        },
        gridPointerdown(event) {
            if (!current.cellSelection || event.button !== 0) return;
            const target = event.target as Element;
            if (target.closest('[data-fill-handle]')) return startFill(event);
            if (target.closest('[data-editing], button, input, select, textarea, a, [data-row-drag], [data-tree-toggle]')) return;
            const at = cellOf(target);
            if (!at) return;
            if (editing && !commitEdit(event)) return;
            setRange(event.shiftKey && range ? range.anchor : at, at);
            follow_((cell) => setRange(range?.anchor ?? at, cell));
        },
        gridCopy(event) {
            if (editing || !cellNav() || (event.target as Element).closest('input, textarea, select, [contenteditable]')) return;
            const box = range?.box ?? (cellAt ? { rows: [cellAt.index], keys: [cellAt.key] } : null);
            if (!box || !event.clipboardData) return;
            event.preventDefault();
            event.clipboardData.setData('text/plain', toClipboard(boxValues(box).map((line) => line.map((value) => editorText(value, locale().code)))));
        },
        gridPaste(event) {
            if (editing || !cellNav() || current.clipboard === false || (event.target as Element).closest('input, textarea, select, [contenteditable]')) return;
            const text = event.clipboardData?.getData('text/plain');
            const start = range?.box ?? (cellAt ? { rows: [cellAt.index], keys: [cellAt.key] } : null);
            if (!text || !start) return;
            event.preventDefault();
            const table = parseClipboard(text);
            const rows = walkable();
            const keys = columnsNow().map((column) => column.key);
            const r0 = rows.indexOf(start.rows[0]!);
            const c0 = keys.indexOf(start.keys[0]!);
            // One value over a block fills the block, as a spreadsheet does; otherwise the text lands from the block's corner.
            const one = table.length === 1 && table[0]!.length === 1;
            const height = one ? start.rows.length : table.length;
            const width = one ? start.keys.length : Math.max(...table.map((line) => line.length));
            const cells: { index: number; key: string; text: string }[] = [];
            for (let r = 0; r < height; r++)
                for (let c = 0; c < width; c++) {
                    const index = rows[r0 + r];
                    const key = keys[c0 + c];
                    const value = one ? table[0]![0] : table[r]?.[c];
                    if (index !== undefined && key !== undefined && value !== undefined) cells.push({ index, key, text: value });
                }
            writeCells(cells, 'paste', event);
            const last = cells.at(-1);
            if (last && !one && (table.length > 1 || width > 1)) setRange({ index: rows[r0]!, key: keys[c0]! }, last);
        },
        gridKeydown: (event) => keydown(event),
        gridClick(event) {
            const at = cellOf(event.target);
            if (!at) return;
            const inEditor = !!(event.target as Element).closest('[data-editing]');
            // A press on another cell keeps what was typed first, or stays if it is refused.
            if (editing && !inEditor && !(editing.row && editing.index === at.index) && !commitEdit(event)) return;
            if (!cellNav() || inEditor) return;
            const moved = !cellAt || cellAt.index !== at.index || cellAt.key !== at.key;
            cellAt = at;
            const column = columnByKey(at.key);
            const row = rowsNow().page[at.index];
            if (current.editOnClick && column && row !== undefined && isEditable(column.column, row) && !(event.target as Element).closest('button, input, select, textarea, a')) startEdit(at.index, at.key, event);
            else if (moved) render();
        },
        gridDblclick(event) {
            const at = cellOf(event.target);
            if (!at || editing || (event.target as Element).closest('button, input, select, textarea, a')) return;
            startEdit(at.index, at.key, event);
        },
        editInput(key, value, redraw) {
            if (!editing) return;
            editing.values[key] = value;
            if (redraw) render();
        },
        commitEdit: (event) => void commitEdit(event),
        cancelEdit: (event) => cancelEdit(event),
        editRow(index, event) {
            const first = columnsNow().find((column) => isEditable(column.column, rowsNow().page[index]!));
            if (first) startEdit(index, first.key, event, undefined, true);
        },
        scrolled(event) {
            const box = event.currentTarget as HTMLElement;
            scrollTop = box.scrollTop;
            scrollLeft = box.scrollLeft;
            if (current.virtualScroll || current.virtualColumns) scheduleScroll();
            if (!current.group || echo) return;
            tableBus.publish(current.group, { kind: 'scroll', source: id, left: box.scrollLeft });
        }
    };

    /**
     * The column list hangs from its button in an overlay, so it is not cut off
     * by the table it covers, and it closes the way any panel does — which is
     * `@vitral/controls`' business, not the table's.
     */
    const chooser = createOverlay({
        anchor: () => chooserEl,
        render: () => chooserView(drawn!),
        placement: 'bottom-end',
        target: () => current.overlayTarget,
        zIndex: current.zIndex,
        onClose: () => {
            chooserOpen = false;
            render();
        }
    });

    /**
     * A column's filter panel hangs from its header's button, as the column
     * list does: conditions on the column's values, or a list of them to
     * tick, applied as they change.
     */
    const filterOverlay = createOverlay({
        anchor: () => (draft && !draft.inline ? (element.querySelector(`[data-filter-button="${cssEscape(draft.key)}"]`) as HTMLElement | null) : null),
        render: () => (drawn ? filterPanelView(drawn) : null),
        placement: 'bottom-start',
        target: () => current.overlayTarget,
        zIndex: current.zIndex,
        onOpen: (panel) => (panel.querySelector('[data-filter-value="0"], [data-filter-search]') as HTMLElement | null)?.focus(),
        onClose: () => {
            draft = null;
            menuKey = null;
            render();
        }
    });

    const menuSettings = () => ({ locale: locale(), unstyled: current.unstyled, overlayTarget: current.overlayTarget, zIndex: current.zIndex, nonce: current.nonce, cssLayer: current.cssLayer });

    // A header's menu, and a cell's: the kit's menu, which takes the keyboard and gives it back.
    const columnMenu = createMenu({
        placement: 'bottom-end',
        onClose: () => {
            if (draft) return;
            menuKey = null;
            render();
        }
    });
    const cellMenu = createMenu({ placement: 'bottom-start' });

    function closeMenus() {
        filterOverlay.close('request');
        columnMenu.close();
        cellMenu.close();
    }

    /** The rows a filter's values come from: every row handed in, before any filter. */
    const sourceRows = (): T[] => (current.value ?? []) as T[];

    function openFilter(column: ResolvedColumn<T>, anchor: HTMLElement | null, inline = false) {
        closeMenus();
        const rows = sourceRows();
        const kind = filterKind(column.column, rows, column.filterField);
        const modes = matchModesFor(column.column, kind);
        const existing = models.filters[column.filterField];
        const options = kind === 'set' ? distinctValues(column.column, rows, column.filterField, locale().code) : [];
        const ticked = existing && !('constraints' in existing) && Array.isArray(existing.value) ? (existing.value as unknown[]) : null;
        const panel = panelFilter(existing, modes);
        draft = {
            key: column.key,
            inline,
            kind,
            modes,
            operator: panel.operator,
            matchModes: [panel.constraints[0].matchMode ?? modes[0]!, panel.constraints[1].matchMode ?? modes[0]!],
            texts: [filterBoxText(panel.constraints[0].value, locale().code), filterBoxText(panel.constraints[1].value, locale().code)],
            search: '',
            options,
            labels: options.map((value) => valueLabel(value)),
            checked: new Set(options.flatMap((value, at) => (!ticked || ticked.some((item) => same(item, value)) ? [at] : []))),
            shown: []
        };
        menuKey = inline ? null : column.key;
        render();
        if (!inline && anchor?.isConnected) filterOverlay.open();
    }

    /** A value as a list filter shows it: a blank as the word for one, a number or a date as the reader writes them. */
    function valueLabel(value: unknown): string {
        if (value === null || value === undefined || value === '') return locale().datagrid.blank;
        if (value instanceof Date) return value.toLocaleDateString(locale().code);
        if (typeof value === 'number') return value.toLocaleString(locale().code);
        return String(value);
    }

    /** The values a list filter's search lets through, by their place among its values. */
    function matching(state: FilterDraft): number[] {
        const search = normalizeText(state.search.trim(), locale().code);
        return state.options.flatMap((_, at) => (!search || normalizeText(state.labels[at]!, locale().code).includes(search) ? [at] : []));
    }

    /** The panel's state as the filter the grid keeps: every value ticked, or no condition with a value, is no filter. */
    function applyDraft() {
        if (!draft) return;
        const column = columnByKey(draft.key);
        if (!column) return;
        if (draft.kind === 'set') {
            const all = draft.checked.size === draft.options.length;
            writeFilter(column.filterField, all ? undefined : { value: draft.options.filter((_, at) => draft!.checked.has(at)), matchMode: 'anyOf' });
        } else {
            const constraints = draft.texts.map((text, at) => ({ matchMode: draft!.matchModes[at], value: readFilterValue(text, draft!.kind, locale()) })) as [FilterConstraint, FilterConstraint];
            const empty = constraints.every((constraint) => constraint.value === null);
            writeFilter(column.filterField, empty ? undefined : fromPanel({ operator: draft.operator, constraints }));
        }
        render();
    }

    /** Sets one column's filter, or takes it away, and applies the filters as one the reader typed. */
    function writeFilter(field: string, entry: FilterMeta[string] | undefined) {
        const filters = { ...models.filters };
        if (entry) filters[field] = entry;
        else delete filters[field];
        models = { ...models, filters };
        current.on?.change?.({ ...models });
        applyFilters(filters);
    }

    /** The control choosing how a condition compares: the kit's select, as the page size is. */
    function modeControl(at: 0 | 1, state: FilterDraft, header: string): Content {
        const host = (modeHosts[at] ??= document.createElement('span'));
        const settings = {
            options: state.modes.map((mode) => ({ label: locale().datagrid.matchModes[mode] ?? mode, value: mode })),
            optionValue: 'value',
            value: state.matchModes[at],
            size: 'small' as const,
            ariaLabel: `${header}: ${locale().datagrid.condition} ${at + 1}`,
            locale: locale(),
            unstyled: current.unstyled,
            overlayTarget: current.overlayTarget,
            zIndex: current.zIndex,
            nonce: current.nonce,
            cssLayer: current.cssLayer,
            pt: { root: { class: 'vt-datagrid-filter-mode' } }
        };
        const select = modeSelects[at];
        if (select) select.update(settings);
        else
            modeSelects[at] = createSelect(host, {
                ...settings,
                onChange: (value) => {
                    if (!draft) return;
                    draft.matchModes[at] = String(value);
                    applyDraft();
                }
            });
        return host;
    }

    function panelView(state: FilterDraft): FilterPanelView | undefined {
        const column = columnByKey(state.key);
        if (!column) return undefined;
        const found = state.kind === 'set' ? matching(state) : [];
        state.shown = found.slice(0, LIST_LIMIT);
        const ticked = found.filter((at) => state.checked.has(at)).length;
        return {
            key: state.key,
            header: column.header,
            kind: state.kind,
            operator: state.operator,
            texts: state.texts,
            modes: state.kind === 'set' ? [null, null] : [modeControl(0, state, column.header), modeControl(1, state, column.header)],
            values: state.shown.map((at) => ({ label: state.labels[at]!, checked: state.checked.has(at) })),
            more: found.length - state.shown.length,
            search: state.search,
            all: ticked === 0 ? 'none' : ticked === found.length ? 'all' : 'some'
        };
    }

    /** Sorts by one column, one way, or takes its sort away: what the column's menu does. */
    function setSort(column: ResolvedColumn<T>, order: 1 | -1 | null, event?: Event) {
        const multiple = current.sortMode === 'multiple';
        const sorts = sortsOf(current, models);
        const kept = multiple ? sorts.filter((sort) => sort.field !== column.sortField) : [];
        const at = multiple ? sorts.findIndex((sort) => sort.field === column.sortField) : 0;
        const next = order ? [...kept.slice(0, at < 0 ? kept.length : at), { field: column.sortField, order }, ...kept.slice(at < 0 ? kept.length : at)] : kept;
        const models_: Partial<DataGridModels> = multiple ? { multiSortMeta: next } : { sortField: next[0]?.field ?? null, sortOrder: next[0]?.order ?? null, multiSortMeta: next };
        if (current.paginator) models_.first = 0;
        change(models_);
        emit('sort', { originalEvent: event as MouseEvent, sortField: next[0]?.field ?? null, sortOrder: next[0]?.order ?? null, multiSortMeta: next });
        requestRows();
    }

    /** What a column's menu offers: sort it, pin it, hide it, or put every column back as it was. */
    function columnItems(column: ResolvedColumn<T>): GridMenuItem[] {
        const words = locale().datagrid;
        const sorted = sortsOf(current, models).find((sort) => sort.field === column.sortField);
        const side = column.sticky?.side ?? null;
        const event = () => new Event('menu');
        const layout = tableLayout(current, withShared());
        const visible = columnsNow().filter((entry) => !entry.selectionMode).length;
        return [
            ...(column.column.sortable
                ? [
                      { label: words.sortAscending, icon: 'arrowUp', disabled: sorted?.order === 1, onSelect: () => setSort(column, 1) },
                      { label: words.sortDescending, icon: 'arrowDown', disabled: sorted?.order === -1, onSelect: () => setSort(column, -1) },
                      { label: words.clearSort, icon: 'close', disabled: !sorted, onSelect: () => setSort(column, null) },
                      { separator: true }
                  ]
                : []),
            ...(filtersByMenu(current, column) ? [{ label: formatMessage(locale().aria.filterColumn, { column: column.header }), icon: 'filter', onSelect: () => openFilter(column, element.querySelector(`[data-filter-button="${cssEscape(column.key)}"]`)) }, { separator: true }] : []),
            { label: words.pinStart, icon: 'pin', disabled: side === 'left', onSelect: () => actions.pin(column, 'left', event()) },
            { label: words.pinEnd, icon: 'pin', disabled: side === 'right', onSelect: () => actions.pin(column, 'right', event()) },
            { label: words.unpin, disabled: !side, onSelect: () => actions.pin(column, null, event()) },
            { separator: true },
            ...(column.column.toggleable !== false ? [{ label: words.hideColumn, icon: 'eyeOff', disabled: visible <= 1, onSelect: () => actions.setVisible(column.key, false, event()) }] : []),
            {
                label: words.resetColumns,
                icon: 'refresh',
                disabled: !Object.values(layout).some((value) => (Array.isArray(value) ? value.length : value && Object.keys(value).length)),
                onSelect: () => writeLayout({})
            }
        ];
    }

    /** The items as the menu takes them: what the host's function made of them, with no separator at either end or two together. */
    function menuItems(items: GridMenuItem[], customise: (items: GridMenuItem[]) => GridMenuItem[]): MenuItem[] {
        const out: MenuItem[] = [];
        for (const item of customise(items)) {
            if (item.separator && (!out.length || out.at(-1)!.separator)) continue;
            out.push({ ...item });
        }
        while (out.at(-1)?.separator) out.pop();
        return out;
    }

    /** What a cell's menu offers: copy the cell, copy its row, export the rows. */
    function openCellMenu(at: { index: number; key: string }, cell: HTMLElement) {
        closeMenus();
        const row = rowsNow().page[at.index];
        const column = columnByKey(at.key);
        if (row === undefined || !column) return;
        const words = locale().datagrid;
        const tr = cell.closest('tr')!;
        const text = (td: Element) => (td as HTMLElement).innerText?.trim() ?? td.textContent?.trim() ?? '';
        const items: GridMenuItem[] = [
            // Over a marked block, Copy takes the block, as Ctrl+C does.
            range && boxSize(range.box) > 1 && range.box.rows.includes(at.index) && range.box.keys.includes(at.key)
                ? { label: words.copy, icon: 'copy', onSelect: () => copyText(toClipboard(boxValues(range!.box).map((line) => line.map((value) => editorText(value, locale().code))))) }
                : { label: words.copy, icon: 'copy', onSelect: () => copyText(text(cell)) },
            { label: words.copyRow, icon: 'copy', onSelect: () => copyText(Array.from(tr.querySelectorAll('td[data-col]'), text).join('\t')) },
            { separator: true },
            { label: words.exportCsv, icon: 'download', onSelect: () => handle.exportCSV() },
            { label: words.exportExcel, icon: 'download', onSelect: () => handle.exportExcel() }
        ];
        const value = cellValue(column.column, row);
        cellMenu.update({
            ...menuSettings(),
            ariaLabel: column.header,
            items: menuItems(items, (base) => (typeof current.contextMenu === 'function' ? current.contextMenu({ row, index: rowsNow().offset + at.index, column: column.column, key: at.key, value, items: base }) : base))
        });
        cellMenu.open(cell);
    }

    function copyText(text: string) {
        void navigator.clipboard?.writeText(text).catch(() => {});
    }

    /**
     * A row put before or after another: the rows handed in, in their new
     * order, for the host to keep. The grid does not reorder what it does not
     * own; the handle keeps the keyboard once the rows come back.
     */
    function moveRow(from: number, over: number, after: boolean, event: Event) {
        const page = rowsNow().page;
        const row = page[from];
        const target = page[over];
        if (row === undefined || target === undefined || row === target) return render();
        const value = [...((current.value ?? []) as T[])];
        const dragIndex = value.indexOf(row);
        if (dragIndex < 0) return render();
        value.splice(dragIndex, 1);
        const dropIndex = value.indexOf(target) + (after ? 1 : 0);
        value.splice(dropIndex, 0, row);
        movedRow = event instanceof KeyboardEvent ? row : null;
        announcement = formatMessage(locale().datagrid.moved, { position: dropIndex + 1, count: value.length });
        emit('row-reorder', { originalEvent: event, row, dragIndex, dropIndex, value });
        render();
    }

    // ---- a block of cells ---------------------------------------------------------------

    const boxSize = (box: RangeBox) => box.rows.length * box.keys.length;

    /** Marks the block from one cell to another, or lets it go, and says what it holds. */
    function setRange(anchor: CellRef | null, focus?: CellRef) {
        const box = anchor && focus ? rangeBox(anchor, focus, walkable(), columnsNow().map((column) => column.key)) : null;
        const next = box ? { anchor: anchor!, focus: focus!, box } : null;
        const same = (a: typeof range, b: typeof range) => a === b || (!!a && !!b && a.box.rows.join() === b.box.rows.join() && a.box.keys.join() === b.box.keys.join());
        if (same(range, next)) return;
        range = next;
        emit('range-change', { range: range ? { rows: range.box.rows.map((index) => rowsNow().offset + index), keys: [...range.box.keys] } : null, values: range ? boxValues(range.box) : [] });
        render();
    }

    /** The values in a block, a list a row. */
    function boxValues(box: RangeBox): unknown[][] {
        const page = rowsNow().page;
        return box.rows.map((index) =>
            box.keys.map((key) => {
                const column = columnByKey(key);
                const row = page[index];
                if (!column || row === undefined) return undefined;
                return column.column.exportValue ? column.column.exportValue(row) : cellValue(column.column, row);
            })
        );
    }

    /**
     * Follows the pointer over the cells while a button is held: each cell it
     * reaches is handed on. The listeners go when the button comes up.
     */
    function follow_(over: (cell: CellRef) => void, done?: () => void) {
        stopPointer?.();
        const move = (event: PointerEvent) => {
            const hit = document.elementFromPoint?.(event.clientX, event.clientY) ?? (event.target as Element);
            const cell = cellOf(hit);
            if (cell) over(cell);
        };
        const up = () => {
            stopPointer?.();
            done?.();
        };
        document.addEventListener('pointermove', move);
        document.addEventListener('pointerup', up);
        element.classList.add('vt-datagrid-selecting');
        stopPointer = () => {
            document.removeEventListener('pointermove', move);
            document.removeEventListener('pointerup', up);
            element.classList.remove('vt-datagrid-selecting');
            stopPointer = null;
        };
    }

    /**
     * The fill handle at the block's corner, dragged down or across: the cells
     * it passes over take the block's values carried on — numbers that step go
     * on stepping, anything else repeats.
     */
    function startFill(event: PointerEvent) {
        if (!range) return;
        event.preventDefault();
        event.stopPropagation();
        const from = range.box;
        const rows = walkable();
        const keys = columnsNow().map((column) => column.key);
        const bottom = rows.indexOf(from.rows.at(-1)!);
        const right = keys.indexOf(from.keys.at(-1)!);
        follow_(
            (cell) => {
                const r = rows.indexOf(cell.index);
                const c = keys.indexOf(cell.key);
                // Down or across, whichever way the pointer went further past the block.
                const next = r - bottom >= c - right ? (r > bottom ? { rows: rows.slice(bottom + 1, r + 1), keys: from.keys } : null) : c > right ? { rows: from.rows, keys: keys.slice(right + 1, c + 1) } : null;
                if (JSON.stringify(next) === JSON.stringify(fillTo)) return;
                fillTo = next;
                render();
            },
            () => {
                const target = fillTo;
                fillTo = null;
                if (!target) return render();
                const values = boxValues(from);
                const cells: { index: number; key: string; value: unknown }[] = [];
                if (target.keys === from.keys) {
                    from.keys.forEach((key, c) => {
                        const run = fillSeries(values.map((line) => line[c]), target.rows.length);
                        target.rows.forEach((index, r) => cells.push({ index, key, value: run[r] }));
                    });
                } else {
                    from.rows.forEach((index, r) => {
                        const run = fillSeries(values[r]!, target.keys.length);
                        target.keys.forEach((key, c) => cells.push({ index, key, value: run[c] }));
                    });
                }
                writeCells(cells, 'fill', event);
                setRange(range!.anchor, target.keys === from.keys ? { index: target.rows.at(-1)!, key: from.keys.at(-1)! } : { index: from.rows.at(-1)!, key: target.keys.at(-1)! });
            }
        );
    }

    /**
     * Writes many cells as one step — a paste, a fill, a block emptied: text
     * read as the kind of value each cell held, checked by its column, and a
     * cell that cannot be edited or refuses its value left as it was.
     */
    function writeCells(cells: ({ index: number; key: string } & ({ text: string } | { value: unknown }))[], source: 'paste' | 'fill' | 'clear', event: Event) {
        const page = rowsNow().page;
        const records: EditRecord<T>[] = [];
        let refused = 0;
        for (const cell of cells) {
            const row = page[cell.index];
            const column = columnByKey(cell.key);
            if (row === undefined || !column || !isEditable(column.column, row)) continue;
            const before = cellValue(column.column, row);
            let value: unknown;
            if ('text' in cell) {
                const parsed = editorKind(before) === 'checkbox' ? { value: cell.text === '' ? null : /^(true|1|yes|x)$/i.test(cell.text.trim()) } : parseEdit(cell.text, before, column.column, row, locale());
                if ('error' in parsed) {
                    refused++;
                    continue;
                }
                value = parsed.value;
            } else value = cell.value;
            if (validateEdit(value, column.column, row)) {
                refused++;
                continue;
            }
            if (same(before, value)) continue;
            writeCell(column.column, row, value);
            records.push({ row, key: cell.key, column: column.column, value: before, newValue: value });
        }
        if (!records.length && !refused) return;
        if (current.undoRedo !== false) history.push(records);
        const changes = records.map((record) => ({ originalEvent: event, row: record.row, index: rowsNow().offset + page.indexOf(record.row), key: record.key, field: record.column.field, value: record.value, newValue: record.newValue }));
        const words = locale().datagrid;
        announcement = formatMessage(refused ? words.cellsChangedRefused : words.cellsChanged, { count: records.length, refused });
        forget();
        emit('cells-change', { originalEvent: event, source, changes });
        render();
    }

    /**
     * A cell whose value changed since it was last drawn flashes: up or down
     * for a number, so a reader watching live values sees which moved and how.
     */
    function flashChanges() {
        const option = current.flashCells;
        if (!option) {
            if (seen.size) seen.clear();
            return;
        }
        const rows = rowsNow();
        const columns = columnsNow();
        const now = Date.now();
        for (const tr of element.querySelectorAll<HTMLElement>('tbody tr[data-index]')) {
            const index = Number(tr.dataset.index);
            const row = rows.page[index];
            if (row === undefined) continue;
            const id = rowKey(current, row, index, rows.offset);
            for (const column of columns) {
                if (!column.field) continue;
                const value = cellValue(column.column, row);
                const key = `${id}\u0001${column.key}`;
                const had = seen.has(key);
                const before = seen.get(key);
                seen.set(key, value instanceof Date ? value.getTime() : value);
                const after = seen.get(key);
                if (!had || Object.is(before, after)) continue;
                const td = tr.querySelector<HTMLElement>(`td[data-col="${cssEscape(column.key)}"]`);
                if (!td) continue;
                const way = typeof before === 'number' && typeof after === 'number' ? (after > before ? 'up' : 'down') : 'change';
                // The attribute again, after a reflow, starts the animation over.
                td.removeAttribute('data-flash');
                void td.offsetWidth;
                td.setAttribute('data-flash', way);
                td.style.setProperty('--vt-datagrid-flash-duration', `${typeof option === 'number' ? option : 1000}ms`);
            }
        }
        // Keys of rows long gone are dropped now and then, so the map does not grow without end.
        if (seen.size > 20_000 && now - flashed > 10_000) {
            flashed = now;
            seen.clear();
        }
    }

    function setChooser(open: boolean) {
        if (open === chooserOpen) return;
        chooserOpen = open;
        render();
    }

    /**
     * The page size, where the host has not handed one in: the kit's select,
     * so a page with no framework gets the control a framework would draw
     * rather than the browser's own.
     */
    function pageSizeControl(context: RowsPerPageContext): Content {
        const options = context.options.map((rows) => ({ label: String(rows), value: rows }));
        if (!pageSizeHost) pageSizeHost = document.createElement('span');
        const settings = {
            options,
            optionValue: 'value',
            value: context.rows,
            size: 'small' as const,
            ariaLabel: locale().rowsPerPage,
            locale: locale(),
            unstyled: current.unstyled,
            overlayTarget: current.overlayTarget,
            zIndex: current.zIndex,
            nonce: current.nonce,
            cssLayer: current.cssLayer,
            // The paginator lays this place out; the control keeps its own look.
            pt: { root: { class: 'vt-paginator-rows-per-page' } }
        };
        if (pageSize) pageSize.update(settings);
        else pageSize = createSelect(pageSizeHost, { ...settings, onChange: (value) => actions.pageSize(Number(value)) });
        return pageSizeHost;
    }

    // ---- the column layout ----------------------------------------------------------

    function writeLayout(next: ColumnLayout) {
        change({ columnLayout: next });
        if (current.group) {
            tableBus.lastLayout.set(current.group, next);
            tableBus.publish(current.group, { kind: 'layout', source: id, layout: next });
        }
    }

    function move(key: string, before: string | null, event: Event) {
        const keys = declaredColumns(current).map((entry) => entry.key);
        const next = moveColumn(tableLayout(current, withShared()), keys, key, before);
        if (!next.order) return;
        writeLayout(next);
        emit('column-reorder', { originalEvent: event, key, order: next.order, layout: next });
    }

    /**
     * `base` is the layout the drag began on, when there is one: the delta is
     * then the whole distance from there. The keyboard steps from the layout
     * as it stands.
     */
    function applyResize(column: ResolvedColumn<T>, delta: number, next: string | undefined, start: Record<string, number>, event: Event, base?: ColumnLayout) {
        if (!delta && !base) return;
        const layout = resizeColumn(base ?? tableLayout(current, withShared()), column.key, delta, {
            min: column.column.minWidth,
            mode: current.columnResizeMode ?? 'fit',
            next: (current.columnResizeMode ?? 'fit') === 'fit' ? next : undefined,
            measured: start
        });
        writeLayout(layout);
        emit('column-resize', { originalEvent: event, key: column.key, width: layout.widths?.[column.key] ?? 0, layout });
    }

    /**
     * What each column measures right now, for arithmetic that needs a width
     * the layout has not got. A column left out of view keeps the width it is
     * laid out at, which every column of such a grid has.
     */
    function measured(): Record<string, number> {
        return Object.fromEntries(columnsNow().map((column) => [column.key, Math.round(headerOf(column.key)?.getBoundingClientRect().width ?? column.width ?? 0)]));
    }

    /** A column's own header, wherever the groups put it. */
    const headerOf = (key: string) => element.querySelector(`thead th[data-column="${cssEscape(key)}"]`) as HTMLElement | null;

    const columnsNow = () => tableColumns(current, withShared());

    /**
     * The column drawn after this one, by key: the resolved columns are made
     * afresh every render, so the one a handler was given is never the same
     * object as the one in the list.
     */
    function columnAfter(column: ResolvedColumn<T>): string | undefined {
        const columns = columnsNow();
        const at = columns.findIndex((entry) => entry.key === column.key);
        return at < 0 ? undefined : columns[at + 1]?.key;
    }

    /** The models as the group has agreed them: its layout, for the columns this table has. */
    function withShared(): DataGridModels {
        if (!current.group || !shared) return models;
        const keys = declaredColumns(current).map((entry) => entry.key);
        return { ...models, columnLayout: layoutFor(keys, shared, models.columnLayout) };
    }

    function joinGroup() {
        stopGroup?.();
        stopGroup = null;
        if (!current.group) return;
        shared = tableBus.lastLayout.get(current.group) ?? null;
        stopGroup = tableBus.subscribe(current.group, (message) => {
            if (message.source === id) return;
            if (message.kind === 'scroll') {
                echo = true;
                const container = element.querySelector('.vt-datagrid-table-container') as HTMLElement | null;
                if (container) container.scrollLeft = message.left;
                requestAnimationFrame(() => (echo = false));
            } else {
                shared = message.layout;
                render();
            }
        });
    }

    // ---- cells, and editing them -----------------------------------------------------

    /** Whether the keyboard moves through cells: as told, or because a column can be edited. */
    const cellNav = () => (current.navigation ? current.navigation === 'cell' : !!current.cellSelection || declaredColumns(current).some(({ column }) => !!column.editable));
    const columnByKey = (key: string) => columnsNow().find((column) => column.key === key);

    /** The cell an event happened in, by the row's index and the column's key. */
    function cellOf(target: EventTarget | null): { index: number; key: string } | null {
        const cell = (target as Element | null)?.closest?.('td[data-col]') as HTMLElement | null;
        const row = cell?.closest('tr[data-index]') as HTMLElement | null;
        if (!cell || !row || !element.contains(cell)) return null;
        return { index: Number(row.dataset.index), key: cell.dataset.col! };
    }

    /** The rows the keyboard walks, in the order drawn: a shut group's rows are not among them. */
    const walkable = () => linesNow(rowsNow()).flatMap((line) => (line.kind === 'row' ? [line.index] : []));

    const cellNode = (index: number, key: string) => element.querySelector(`tbody tr[data-index="${index}"] td[data-col="${cssEscape(key)}"]`) as HTMLElement | null;

    /** Puts the keyboard on a cell: scrolled into view (and drawn, in a virtual grid), then focused. */
    function moveTo(index: number, key: string) {
        cellAt = { index, key };
        scrollToIndex(index);
        showColumn(key);
        cellNode(index, key)?.focus({ preventScroll: !!(current.virtualScroll || current.virtualColumns) });
    }

    /** Scrolls a grid that draws its columns as they come into view until this one is drawn. */
    function showColumn(key: string) {
        if (!current.virtualColumns || !container) return;
        const columns = columnsNow();
        const middle = columns.filter((column) => !column.sticky);
        const at = middle.findIndex((column) => column.key === key);
        if (at < 0) return;
        const start = middle.slice(0, at).reduce((sum, column) => sum + (column.width ?? 0), 0);
        const end = start + (middle[at]!.width ?? 0);
        const room = (viewWidth || 1200) - columns.filter((column) => column.sticky).reduce((sum, column) => sum + (column.width ?? 0), 0);
        const from = Math.abs(scrollLeft);
        let next = from;
        if (start < from) next = start;
        else if (end > from + room) next = end - room;
        if (next === from) return;
        scrollLeft = next;
        container.scrollLeft = getComputedStyle(element).direction === 'rtl' ? -next : next;
        render();
    }

    /**
     * Opens a cell for editing — or, editing whole rows, every editable cell of
     * its row — with what it holds as the editor's text, or with what the
     * reader started typing.
     */
    function startEdit(index: number, key: string, event?: Event, typed?: string, wholeRow?: boolean) {
        const row = rowsNow().page[index];
        const column = columnByKey(key);
        if (row === undefined || !column) return;
        const byRow = wholeRow || current.editMode === 'row';
        const open = byRow ? columnsNow().filter((entry) => isEditable(entry.column, row)) : isEditable(column.column, row) ? [column] : [];
        if (!open.length) return;
        if (editing && !commitEdit(event)) return;
        const values: Record<string, unknown> = {};
        const kinds: EditingView['kinds'] = {};
        const originals: Record<string, unknown> = {};
        for (const entry of open) {
            const value = cellValue(entry.column, row);
            originals[entry.key] = value;
            kinds[entry.key] = editorKind(value);
            values[entry.key] = kinds[entry.key] === 'checkbox' ? !!value : editorText(value, locale().code);
        }
        const target = open.some((entry) => entry.key === key) ? key : open[0]!.key;
        if (typed !== undefined && kinds[target] !== 'checkbox') values[target] = typed;
        editing = { index, keys: open.map((entry) => entry.key), values, kinds, errors: {}, row: byRow, rowData: row, originals };
        cellAt = { index, key: target };
        focusEditor = { key: target, select: typed === undefined };
        emit('cell-edit-start', { originalEvent: event, row, index: rowsNow().offset + index, key: target, field: columnByKey(target)?.field, value: originals[target] });
        render();
    }

    const same = (a: unknown, b: unknown) => Object.is(a, b) || (a instanceof Date && b instanceof Date && a.getTime() === b.getTime());

    /**
     * Keeps what the editors hold, if every value passes: read back as values
     * of the kinds the cells held, checked by the columns, and written into
     * the row. A value that is refused keeps its editor open, saying why.
     */
    function commitEdit(event?: Event): boolean {
        if (!editing) return true;
        const { rowData: row, keys, values, originals } = editing;
        const parsed: Record<string, unknown> = {};
        const errors: Record<string, string> = {};
        for (const key of keys) {
            const column = columnByKey(key);
            if (!column) continue;
            const result = parseEdit(values[key], originals[key], column.column, row, locale());
            if ('error' in result) errors[key] = result.error;
            else {
                const refused = validateEdit(result.value, column.column, row);
                if (refused) errors[key] = refused;
                else parsed[key] = result.value;
            }
        }
        if (Object.keys(errors).length) {
            editing.errors = errors;
            focusEditor = { key: Object.keys(errors)[0]!, select: false };
            render();
            return false;
        }
        const records: EditRecord<T>[] = [];
        for (const key of keys) {
            const column = columnByKey(key)!;
            if (!(key in parsed) || same(originals[key], parsed[key])) continue;
            writeCell(column.column, row, parsed[key]);
            records.push({ row, key, column: column.column, value: originals[key], newValue: parsed[key] });
        }
        if (current.undoRedo !== false) history.push(records);
        const wasRow = editing.row;
        const index = rowsNow().offset + editing.index;
        const key = cellAt?.key ?? keys[0]!;
        editing = null;
        // The row may have moved: a sorted column was edited, or a filter no longer lets it through.
        forget();
        follow(row, key);
        const changes = records.map((record) => ({ originalEvent: event, row, index, key: record.key, field: record.column.field, value: record.value, newValue: record.newValue }));
        if (wasRow) emit('row-edit-save', { originalEvent: event, row, index, changes });
        else emit('cell-edit-complete', changes[0] ?? { originalEvent: event, row, index, key, field: columnByKey(key)?.field, value: originals[key], newValue: originals[key] });
        render();
        refocus(wasRow);
        return true;
    }

    function cancelEdit(event?: Event) {
        if (!editing) return;
        const { rowData: row, row: wasRow, index } = editing;
        const key = cellAt?.key ?? editing.keys[0]!;
        editing = null;
        if (wasRow) emit('row-edit-cancel', { originalEvent: event, row, index: rowsNow().offset + index });
        else emit('cell-edit-cancel', { originalEvent: event, row, index: rowsNow().offset + index, key, field: columnByKey(key)?.field, value: cellValue(columnByKey(key)!.column, row) });
        render();
        refocus(wasRow);
    }

    /** Keeps the keyboard on a row that moved, by finding it again among the rows on show. */
    function follow(row: T, key: string) {
        const at = rowsNow().page.indexOf(row);
        if (at >= 0) cellAt = { index: at, key };
    }

    /** After an editor closes, the keyboard goes back where it was: the cell, or the row's Edit button. */
    function refocus(wasRow: boolean) {
        if (!cellAt) return;
        if (cellNav()) return moveTo(cellAt.index, cellAt.key);
        if (wasRow) (element.querySelector(`tbody tr[data-index="${cellAt.index}"] [data-row-editor="edit"]`) as HTMLElement | null)?.focus();
    }

    /** Tab out of an editor: on to the next cell that can be edited, in reading order, and open it. */
    function tabFrom(from: { index: number; key: string }, back: boolean) {
        const rows = walkable();
        const page = rowsNow().page;
        const keys = columnsNow().map((column) => column.key);
        const cells = rows.flatMap((index) => keys.map((key) => ({ index, key })));
        let at = cells.findIndex((cell) => cell.index === from.index && cell.key === from.key);
        while (at >= 0) {
            at += back ? -1 : 1;
            const cell = cells[at];
            if (!cell) break;
            if (isEditable(columnByKey(cell.key)!.column, page[cell.index]!)) {
                moveTo(cell.index, cell.key);
                return startEdit(cell.index, cell.key);
            }
        }
        moveTo(from.index, from.key);
    }

    /** Undoes the last step of edits, or does it again, and says so. */
    function replay(redo: boolean) {
        if (editing || current.undoRedo === false) return;
        const step = redo ? history.redo() : history.undo();
        if (!step) return;
        const page = rowsNow().page;
        for (const record of step) {
            writeCell(record.column, record.row, redo ? record.newValue : record.value);
            emit('cell-edit-undo', {
                row: record.row,
                index: rowsNow().offset + page.indexOf(record.row),
                key: record.key,
                field: record.column.field,
                value: redo ? record.value : record.newValue,
                newValue: redo ? record.newValue : record.value,
                redo
            });
        }
        const last = step.at(-1)!;
        const header = last.column.header ?? last.column.field ?? last.key;
        // A trailing space when the words repeat, so a reader hears it again.
        const said = formatMessage(redo ? locale().datagrid.redone : locale().datagrid.undone, { column: header });
        announcement = said === announcement ? `${said}\u00a0` : said;
        forget();
        follow(last.row, last.key);
        render();
        if (cellAt && cellNav()) moveTo(cellAt.index, cellAt.key);
    }

    /**
     * The keyboard over the grid. In an editor: Enter keeps, Escape drops, Tab
     * keeps and moves on. On a cell: the arrows, Home, End and the page keys
     * move, Enter and F2 open the editor, typing opens it with what was typed,
     * Delete empties the cell and Space selects the row. Anywhere but an
     * editor, Ctrl+Z and Ctrl+Y undo and redo.
     */
    function keydown(event: KeyboardEvent) {
        const target = event.target as HTMLElement;
        const mod = event.ctrlKey || event.metaKey;
        if (editing) {
            // A key the editor took for itself (a select choosing an option on Enter) is the editor's.
            if (!target.closest('[data-editing]') || event.defaultPrevented) return;
            if (event.key === 'Escape') {
                event.preventDefault();
                cancelEdit(event);
            } else if (event.key === 'Enter' && !event.isComposing) {
                event.preventDefault();
                commitEdit(event);
            } else if (event.key === 'Tab' && !editing.row) {
                event.preventDefault();
                const from = { index: editing.index, key: cellAt?.key ?? editing.keys[0]! };
                if (commitEdit(event)) tabFrom(from, event.shiftKey);
            }
            return;
        }
        if (mod && !event.altKey && /^[zy]$/i.test(event.key) && !target.closest('input, textarea, select, [contenteditable]')) {
            if (current.undoRedo === false) return;
            event.preventDefault();
            return replay(event.key.toLowerCase() === 'y' || (event.key.toLowerCase() === 'z' && event.shiftKey));
        }
        if (!cellNav()) return;
        const at = cellOf(target);
        // A control inside a cell keeps its own keys.
        if (!at || target !== cellNode(at.index, at.key)) return;
        const rows = walkable();
        const keys = columnsNow().map((column) => column.key);
        const r = rows.indexOf(at.index);
        const c = keys.indexOf(at.key);
        const rtl = getComputedStyle(element).direction === 'rtl';
        const go = (row: number, column: number) => {
            event.preventDefault();
            const index = rows[Math.max(0, Math.min(rows.length - 1, row))];
            const key = keys[Math.max(0, Math.min(keys.length - 1, column))];
            if (index === undefined || key === undefined) return;
            // Shift carries the block with the keyboard; a move without it lets the block go.
            if (event.shiftKey && current.cellSelection) setRange(range?.anchor ?? at, { index, key });
            else if (range) setRange(null);
            moveTo(index, key);
        };
        const page = Math.max(1, Math.floor((viewHeight || fallbackHeight()) / (current.rowHeight ?? (estimate || 40))) - 1);
        const row = rowsNow().page[at.index];
        const column = columnByKey(at.key);
        const editable = row !== undefined && !!column && isEditable(column.column, row);
        if (current.cellSelection && mod && !event.altKey && event.key.toLowerCase() === 'a') {
            event.preventDefault();
            return setRange({ index: rows[0]!, key: keys[0]! }, { index: rows.at(-1)!, key: keys.at(-1)! });
        }
        if (event.key === 'Escape' && range) {
            event.preventDefault();
            return setRange(null);
        }
        // Delete over a block empties every cell of it that can be edited, as one step.
        if ((event.key === 'Delete' || event.key === 'Backspace') && range && boxSize(range.box) > 1) {
            event.preventDefault();
            return writeCells(range.box.rows.flatMap((index) => range!.box.keys.map((key) => ({ index, key, text: '' }))), 'clear', event);
        }
        switch (event.key) {
            case 'ArrowDown':
                return go(mod ? rows.length - 1 : r + 1, c);
            case 'ArrowUp':
                return go(mod ? 0 : r - 1, c);
            case 'ArrowRight':
                return go(r, mod ? (rtl ? 0 : keys.length - 1) : c + (rtl ? -1 : 1));
            case 'ArrowLeft':
                return go(r, mod ? (rtl ? keys.length - 1 : 0) : c + (rtl ? 1 : -1));
            case 'Home':
                return go(mod ? 0 : r, 0);
            case 'End':
                return go(mod ? rows.length - 1 : r, keys.length - 1);
            case 'PageDown':
                return go(r + page, c);
            case 'PageUp':
                return go(r - page, c);
            case 'Enter':
            case 'F2': {
                // A row of a tree that cannot be edited here opens or shuts on Enter.
                const place = row === undefined ? undefined : rowsNow().tree?.get(row);
                if (!editable && event.key === 'Enter' && place?.hasChildren && cellNode(at.index, at.key)?.querySelector('[data-tree-toggle]')) {
                    event.preventDefault();
                    return actions.toggleTree(row!, place.key, event);
                }
                if (!editable) return;
                event.preventDefault();
                return startEdit(at.index, at.key, event);
            }
            case 'Delete':
            case 'Backspace':
                if (!editable || editorKind(cellValue(column!.column, row)) === 'checkbox' || current.editMode === 'row') return;
                event.preventDefault();
                startEdit(at.index, at.key, event, '');
                commitEdit(event);
                return;
            case ' ':
                if (!current.selectionMode && !selectionKind(current, columnsNow())) return;
                event.preventDefault();
                return actions.toggleRow(row!, rowsNow().offset + at.index, event, 'row');
        }
        // Typing into a cell opens its editor with what was typed.
        if (editable && event.key.length === 1 && !mod && !event.altKey && editorKind(cellValue(column!.column, row)) !== 'checkbox') {
            event.preventDefault();
            startEdit(at.index, at.key, event, event.key);
        }
    }

    // ---- what is in view ---------------------------------------------------------------

    /** The box's size, followed as it changes: a virtual grid draws what fits in it. */
    function watch(el: HTMLElement | null) {
        if (el === container) return;
        container = el;
        watcher?.disconnect();
        watcher = null;
        if (!el || typeof ResizeObserver === 'undefined') return;
        watcher = new ResizeObserver(() => {
            if (!current.virtualScroll && !current.virtualColumns) return;
            if (el.clientHeight === viewHeight && el.clientWidth === viewWidth) return;
            scheduleScroll(true);
        });
        watcher.observe(el);
    }

    /** One draw a frame while the box scrolls, and none while it stays inside what is drawn. */
    function scheduleScroll(force = false) {
        if (scrollFrame) return;
        scrollFrame = requestAnimationFrame(() => {
            scrollFrame = 0;
            if (force) drawnWindow = '';
            const next = frame();
            if (next.signature !== drawnWindow) render(next);
        });
    }

    /**
     * The key a line's height is remembered by: its row's `dataKey` value as it
     * is, or its group's. A number, not its text: looked up for every line of a
     * large grid, a number is found at once where a new string must be hashed.
     */
    const lineKey = (line: ViewContext<T>['lines'][number], offset: number): unknown =>
        line.kind === 'group' ? `group:${line.group.key}` : expansionKey(current, line.row, line.index, offset);

    let linesMemo: { inputs: unknown[]; lines: ViewContext<T>['lines'] } | null = null;
    function linesNow(rows: ResolvedRows<T>): ViewContext<T>['lines'] {
        const inputs = [rows.page, rows.tree, current.groupBy, models.collapsedGroups];
        if (linesMemo && linesMemo.inputs.every((value, index) => value === inputs[index])) return linesMemo.lines;
        linesMemo = { inputs, lines: linesOf(current, models, rows.page, rows.tree) };
        return linesMemo.lines;
    }

    /**
     * Where each line starts, and how many rows of the table come before it —
     * a line that is open is two — worked out again only when the lines or
     * what is known of their heights change.
     */
    let placesMemo: { inputs: unknown[]; keys: unknown[]; offsets: Float64Array; rowsBefore: Int32Array } | null = null;
    function places(lines: ViewContext<T>['lines'], offset: number) {
        const inputs = [lines, heightsVersion, estimate, current.rowHeight, models.expandedRows, current.content?.rowExpansion];
        if (placesMemo && placesMemo.inputs.every((value, index) => value === inputs[index])) return placesMemo;
        // Plain loops: run over every line of a large grid on each sort or filter.
        const count = lines.length;
        const keys = new Array<unknown>(count);
        for (let index = 0; index < count; index++) keys[index] = lineKey(lines[index]!, offset);
        const fallback = current.rowHeight ?? (estimate || 40);
        const offsets = new Float64Array(count + 1);
        if (heights.size) {
            for (let index = 0; index < count; index++) {
                const height = heights.get(keys[index]!);
                offsets[index + 1] = offsets[index]! + (height === undefined ? fallback : height);
            }
        } else for (let index = 0; index < count; index++) offsets[index + 1] = (index + 1) * fallback;
        const rowsBefore = new Int32Array(count + 1);
        const open = current.content?.rowExpansion && models.expandedRows?.length ? new Set(models.expandedRows.map(String)) : null;
        for (let index = 0; index < count; index++) {
            const line = lines[index]!;
            const detail = open !== null && line.kind === 'row' && open.has(String(expansionKey(current, line.row, line.index, offset)));
            rowsBefore[index + 1] = rowsBefore[index]! + (detail ? 2 : 1);
        }
        placesMemo = { inputs, keys, offsets, rowsBefore };
        return placesMemo;
    }

    /** The height the box shows when it has not been measured: its own height, or 400px. */
    const fallbackHeight = () => {
        const given = parseFloat(current.scrollHeight ?? '');
        return Number.isFinite(given) && current.scrollHeight?.endsWith('px') ? given : 400;
    };

    /**
     * Everything a draw needs that depends on what is in view: the rows and
     * columns, the lines, and — in a virtual grid — which of them to draw.
     */
    function frame() {
        const shownModels = withShared();
        const columns = tableColumns(current, shownModels);
        const rows = rowsNow();
        const lines = linesNow(rows);
        const pinnedTop = pinnedRowsOf(current.pinnedTopRows, rows);
        const pinnedBottom = pinnedRowsOf(current.pinnedBottomRows, rows);
        let virtual: VirtualRows | undefined;
        let rowWindow: VirtualWindow | undefined;
        if (current.virtualScroll) {
            const { offsets, rowsBefore } = places(lines, rows.offset);
            const view = viewHeight || fallbackHeight();
            rowWindow = windowOf(offsets, scrollTop, scrollTop + view, current.overscan ?? 6);
            const frameCount = frameRows({ columns, config: current, filters: models.filters, pinnedTop, pinnedBottom });
            virtual = {
                window: rowWindow,
                rowIndex: (line) => frameCount.head + rowsBefore[line]! + 1,
                rowCount: frameCount.head + rowsBefore[lines.length]! + frameCount.foot,
                rowsBefore: rowsBefore[rowWindow.start]!
            };
        }
        let drawn: DrawnColumn<T>[] = columns;
        let columnWindow: VirtualWindow | undefined;
        if (current.virtualColumns) {
            const middle = columns.filter((column) => !column.sticky);
            const pinnedWidth = columns.filter((column) => column.sticky).reduce((sum, column) => sum + (column.width ?? 0), 0);
            const offsets = offsetsOf(middle.length, (index) => middle[index]!.width ?? 0);
            // Right to left, a box scrolled from its start reports a negative distance.
            const from = Math.abs(scrollLeft);
            columnWindow = windowOf(offsets, from, from + Math.max(0, (viewWidth || 1200) - pinnedWidth), 2);
            const { start, end, before, after } = columnWindow;
            drawn = [
                ...columns.filter((column) => column.sticky?.side === 'left'),
                ...(before > 0 ? [{ spacer: true as const, key: '__columns-before', width: before }] : []),
                ...middle.slice(start, end),
                ...(after > 0 ? [{ spacer: true as const, key: '__columns-after', width: after }] : []),
                ...columns.filter((column) => column.sticky?.side === 'right')
            ];
        }
        const signature = `${rowWindow ? `${rowWindow.start}:${rowWindow.end}` : ''}|${columnWindow ? `${columnWindow.start}:${columnWindow.end}` : ''}`;
        return { shownModels, columns, rows, lines, pinnedTop, pinnedBottom, virtual, drawn, signature };
    }

    /**
     * Measures what was just drawn: the box, and the rows of a virtual grid,
     * whose heights decide where every later row starts. A row that turned out
     * taller or shorter than it was taken to be is drawn again in its place.
     */
    function measure() {
        if (!container || (!current.virtualScroll && !current.virtualColumns)) return;
        const sizeChanged = container.clientHeight !== viewHeight || container.clientWidth !== viewWidth;
        viewHeight = container.clientHeight;
        viewWidth = container.clientWidth;
        if (!current.virtualScroll || !placesMemo) {
            if (sizeChanged) scheduleScroll(true);
            return;
        }
        const sums = new Map<number, number>();
        container.querySelectorAll<HTMLElement>('tbody tr[data-line]').forEach((tr) => {
            const line = Number(tr.dataset.line);
            sums.set(line, (sums.get(line) ?? 0) + tr.getBoundingClientRect().height);
        });
        let changed = false;
        let seen = 0;
        let sum = 0;
        for (const [line, height] of sums) {
            const key = placesMemo.keys[line];
            if (key === undefined || !(height > 0)) continue;
            seen++;
            sum += height;
            if (Math.abs((heights.get(key) ?? -1) - height) > 0.5) {
                heights.set(key, height);
                changed = true;
            }
        }
        if (!estimate && seen) estimate = sum / seen;
        if (changed) heightsVersion++;
        if (changed || sizeChanged) scheduleScroll(true);
    }

    function scrollToIndex(index: number) {
        if (!current.virtualScroll || !container) {
            render();
            const row = element.querySelector(`tbody tr[data-index="${index}"]`) as HTMLElement | null;
            row?.scrollIntoView?.({ block: 'nearest' });
            return;
        }
        const rows = rowsNow();
        const lines = linesNow(rows);
        const line = lines.findIndex((entry) => entry.kind === 'row' && entry.index === index);
        if (line < 0) return;
        const { offsets } = places(lines, rows.offset);
        const view = viewHeight || fallbackHeight();
        // What the sticky head and foot cover is not in view.
        const head = (element.querySelector('thead') as HTMLElement | null)?.offsetHeight ?? 0;
        const foot = (element.querySelector('tfoot') as HTMLElement | null)?.offsetHeight ?? 0;
        const top = offsets[line]!;
        const bottom = offsets[line + 1]!;
        if (top < scrollTop) scrollTop = top;
        else if (bottom > scrollTop + view - head - foot) scrollTop = Math.max(0, bottom - view + head + foot);
        container.scrollTop = scrollTop;
        render();
    }

    /** Drops what was worked out from the rows, for rows that changed where the table cannot see. */
    function forget() {
        rowsMemo = null;
        linesMemo = null;
        placesMemo = null;
    }

    // ---- drawing --------------------------------------------------------------------

    function render(state = frame()) {
        // An edited row the rows no longer hold — the data changed under it — has nothing left to edit.
        if (editing) {
            const at = state.rows.page.indexOf(editing.rowData);
            if (at < 0) editing = null;
            else editing.index = at;
        }
        const { shownModels, columns, rows, lines, pinnedTop, pinnedBottom, virtual, drawn: drawnColumns, signature } = state;
        drawnWindow = signature;
        const kind = selectionKind(current, columns);
        const cover = mode() === 'local' ? rows.all : rows.page;
        const declared = declaredColumns(current);
        const layout = tableLayout(current, shownModels);
        const shownToggleable = declared.filter(({ column, key }) => column.toggleable !== false && !column.selectionMode && !(layout.hidden ?? []).includes(key));
        const context: ViewContext<T> = {
            config: current,
            models,
            columns,
            drawn: drawnColumns,
            rows,
            pinnedTop,
            pinnedBottom,
            virtual,
            lines,
            filters: models.filters,
            locale: locale(),
            ids,
            busy: !!current.loading || (mode() === 'source' && (sourceLoading || remote === undefined)),
            part,
            pagePart,
            on: actions,
            allState: allSelectedState(current, models, cover),
            selected: (row: T) => rowSelected(current, models, kind, row),
            selectionKind: kind,
            sorts: sortsOf(current, models),
            tabRow: Math.min(activeRow, Math.max(0, rows.page.length - 1)),
            chooser: {
                open: chooserOpen,
                columns: declared
                    .filter(({ column }) => column.toggleable !== false && !column.selectionMode)
                    .map(({ column, key }, _index, all) => ({
                        key,
                        header: column.header ?? column.field ?? key,
                        visible: !(layout.hidden ?? []).includes(key),
                        last: shownToggleable.length === 1 && all.length > 0
                    }))
            },
            dragging,
            dropOn,
            resizing,
            cellFocus: cellNav() ? tabCell(lines) : undefined,
            menus: { filter: true, column: !!current.columnMenu, open: menuKey },
            rowDrag: rowDrag ?? (columnsNow().some((column) => column.column.rowDrag) ? { index: -1, over: null, after: false } : undefined),
            status: current.statusBar ? statusOf(rows) : undefined,
            sideBar: sideBarOf(),
            range: range && (boxSize(range.box) > 1 || current.fillHandle) ? { box: range.box, fill: fillTo, handle: !!current.fillHandle } : undefined,
            filterPanel: draft ? panelView(draft) : undefined,
            editing: editing ?? undefined,
            announcement
        };
        const emptyMessage = current.emptyMessage ?? (hasActiveFilter(applied) ? locale().emptySearchMessage : locale().emptyMessage);
        // A virtual grid scrolls in a box of its own, 400px tall unless it is told otherwise.
        const scrollable = current.scrollable || !!current.virtualScroll;
        root.attrs(
            part('root', {
                striped: current.stripedRows,
                gridlines: current.showGridlines,
                size: current.size,
                scrollable,
                loading: context.busy,
                fixedRows: !!current.rowHeight
            })
        );
        drawn = {
            ...context,
            config: {
                ...current,
                scrollable,
                scrollHeight: current.scrollHeight ?? (current.virtualScroll ? '400px' : undefined),
                emptyMessage,
                // The host's own controls win; the table draws these when it has none.
                content: { ...current.content, rowsPerPage: current.content?.rowsPerPage ?? pageSizeControl }
            }
        };
        root.render(gridView(drawn));
        tableBars.sync();
        // After the table, so the button the panel hangs from is the one just drawn.
        if (chooserOpen) chooser.open();
        else chooser.close();
        chooser.update();
        if (draft && !draft.inline) filterOverlay.update();
        else if (filterOverlay.isOpen) filterOverlay.close('request');
        chooserBars.sync();
        measure();
        flashChanges();
        if (movedRow) {
            const at = rowsNow().page.indexOf(movedRow);
            const handleEl = at >= 0 ? (element.querySelector(`tbody tr[data-index="${at}"] [data-row-drag]`) as HTMLElement | null) : null;
            if (handleEl) {
                movedRow = null;
                handleEl.focus();
            }
        }
        if (focusEditor) {
            const { key, select } = focusEditor;
            focusEditor = null;
            const cell = editing ? cellNode(editing.index, key) : null;
            const box = (cell?.querySelector('[data-editor]') ?? cell?.querySelector('input, select, textarea, button, [tabindex]')) as HTMLElement | null;
            box?.focus({ preventScroll: true });
            if (box instanceof HTMLInputElement && box.type === 'text') {
                if (select) box.select();
                else box.setSelectionRange(box.value.length, box.value.length);
            }
        }
    }

    /** The side bar's panels, as asked for. */
    const sidePanels = (): SidePanel[] => (current.sideBar === true ? ['columns', 'filters'] : current.sideBar ? current.sideBar.filter((panel) => panel === 'columns' || panel === 'filters') : []);

    /** The columns the columns panel lists, in the order they stand, hidden ones in their place. */
    function sideColumns() {
        const layout = tableLayout(current, withShared());
        const declared = declaredColumns(current).filter(({ column }) => column.toggleable !== false && !column.selectionMode);
        const order = layout.order ?? [];
        const place = (key: string) => (order.includes(key) ? order.indexOf(key) : order.length + declared.findIndex((entry) => entry.key === key));
        const hidden = layout.hidden ?? [];
        const shown = declared.filter(({ key }) => !hidden.includes(key)).length;
        return [...declared]
            .sort((a, b) => place(a.key) - place(b.key))
            .map(({ column, key }) => ({ key, header: column.header ?? column.field ?? key, visible: !hidden.includes(key), last: shown === 1 }));
    }

    /** The columns the filters panel holds: those with a filter, shown or not. */
    const sideFilterColumns = () => tableColumns(current, withShared()).filter((column) => !!column.column.filter && !!column.filterField && !column.selectionMode);

    function sideBarOf(): SideBarView | undefined {
        const panels = sidePanels();
        if (!panels.length) return undefined;
        const open = sidePanel && panels.includes(sidePanel) ? sidePanel : null;
        return {
            panels,
            open,
            search: sideSearch,
            columns: open === 'columns' ? sideColumns() : [],
            filters:
                open === 'filters'
                    ? sideFilterColumns().map((column) => ({
                          key: column.key,
                          header: column.header,
                          active: !!models.filters[column.filterField],
                          open: !!draft?.inline && draft.key === column.key
                      }))
                    : [],
            dragging: sideDragging,
            dropOn: sideDropOn
        };
    }

    /** What the status bar counts. */
    function statusOf(rows: ResolvedRows<T>): StatusContext<T> {
        const selection = models.selection;
        const selected = Array.isArray(selection) ? selection.length : selection === null || selection === undefined ? 0 : 1;
        const total = mode() === 'local' ? (current.value ?? []).length : rows.total;
        return { total, filtered: rows.total, selected, rows: rows.all, range: rangeTotals() };
    }

    /** The cell in the tab order: the one the keyboard was on, or the first. */
    function tabCell(lines: ViewContext<T>['lines']): { index: number; key: string } | undefined {
        const keys = columnsNow().map((column) => column.key);
        const first = lines.find((line) => line.kind === 'row');
        if (!first || !keys.length) return undefined;
        if (cellAt && keys.includes(cellAt.key) && lines.some((line) => line.kind === 'row' && line.index === cellAt!.index)) return cellAt;
        return { index: (first as { index: number }).index, key: keys[0]! };
    }

    function csv(options: DataGridExportOptions = {}): string {
        const columns = tableColumns(current, withShared());
        const rows = rowsNow();
        const scope = options.scope ?? 'all';
        const selection = models.selection;
        const chosen = scope === 'page' ? rows.page : scope === 'selection' ? ((Array.isArray(selection) ? selection : selection ? [selection] : []) as T[]) : rows.all;
        const text = toCSV(chosen, columns, options);
        return options.bom ? `\ufeff${text}` : text;
    }

    function xlsx(options: DataGridXlsxOptions & { scope?: DataGridExportOptions['scope'] }): Uint8Array {
        const rows = rowsNow();
        const scope = options.scope ?? 'all';
        const selection = models.selection;
        const chosen = scope === 'page' ? rows.page : scope === 'selection' ? ((Array.isArray(selection) ? selection : selection ? [selection] : []) as T[]) : rows.all;
        return toXlsx(chosen, tableColumns(current, withShared()), options);
    }

    joinGroup();
    render();
    requestRows();

    const handle: DataGridHandle<T> = {
        element,
        update(next) {
            const wasGroup = current.group;
            own = { ...own, ...next };
            current = pivoted(own);
            // The rows may have changed in place, under the same array.
            forget();
            const changedModels = pickModels(next);
            if (Object.keys(changedModels).length) models = { ...models, ...changedModels };
            // A filter the host changed is applied as one the reader typed: reported, and
            // asked of the server. Compared by content, since a host may hand back the
            // same object with a value changed inside it, or the filters it already had.
            if ('filters' in changedModels && filtersKey(models.filters) !== filtersKey(applied)) applyFilters(models.filters);
            if (current.group !== wasGroup) joinGroup();
            if (!current.unstyled && current.paginator) loadStyle(paginatorStyle.name, paginatorStyle.css, styleOptions());
            if ('value' in next || 'dataSource' in next || 'lazy' in next) {
                if (current.dataSource) requestSource();
            }
            if (clampPage()) return;
            render();
        },
        state: () => ({ ...models }),
        refresh() {
            forget();
            render();
        },
        reload: requestSource,
        scrollToIndex,
        startEdit: (index, key) => startEdit(index, key),
        stopEdit(cancel) {
            if (!cancel) return commitEdit();
            cancelEdit();
            return true;
        },
        focusCell: moveTo,
        selectRange(anchor, focus) {
            setRange(anchor, focus ?? anchor);
        },
        clearRange: () => setRange(null),
        getRange() {
            if (!range) return null;
            return { rows: range.box.rows.map((index) => rowsNow().offset + index), keys: [...range.box.keys], values: boxValues(range.box) };
        },
        toXlsx: (options = {}) => xlsx(options),
        exportExcel(options = {}) {
            if (typeof document === 'undefined') return;
            const blob = new Blob([xlsx(options) as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = options.filename ?? 'table.xlsx';
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url));
        },
        expandAll() {
            if (current.treeData) {
                const keyOf = (row: T, path: string) => treeKey(current, row, path);
                change({ expandedTree: treeKeys((current.value ?? []) as T[], childrenOf(current.treeData), keyOf) });
            } else if (current.groupBy) change({ collapsedGroups: [] });
        },
        collapseAll() {
            if (current.treeData) change({ expandedTree: [] });
            else if (current.groupBy) change({ collapsedGroups: groupKeys(rowsNow().page, groupFields(current.groupBy)) });
        },
        undo: () => replay(false),
        redo: () => replay(true),
        toCSV: csv,
        exportCSV(options = {}) {
            if (typeof document === 'undefined') return;
            const text = csv({ ...options, bom: false });
            const blob = new Blob([options.bom === false ? '' : '\ufeff', text], { type: 'text/csv;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = options.filename ?? 'table.csv';
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url));
        },
        destroy() {
            clearTimeout(filterTimer);
            if (scrollFrame) cancelAnimationFrame(scrollFrame);
            watcher?.disconnect();
            stopGroup?.();
            tableBars.destroy();
            chooserBars.destroy();
            chooser.destroy();
            filterOverlay.destroy();
            stopPointer?.();
            columnMenu.destroy();
            cellMenu.destroy();
            modeSelects.forEach((select) => select?.destroy());
            pageSize?.destroy();
            root.clear();
        }
    };
    return handle;
}

/** The configuration a pivot asks for: its rows and columns in place of the ones handed in, none of them to edit. */
function pivoted<T>(config: DataGridConfig<T>): DataGridConfig<T> {
    if (!config.pivot) return config;
    const { rows, columns } = pivotOf((config.value ?? []) as T[], config.pivot, (config.columns ?? []) as DataGridColumn<T>[], config.locale?.code);
    return { ...config, value: rows as T[], columns: columns as DataGridColumn<T>[], dataKey: PIVOT_KEY, groupBy: undefined, treeData: undefined };
}

const pickModels = (config: Partial<DataGridConfig>): Partial<DataGridModels> => {
    const out: Partial<DataGridModels> = {};
    for (const key of ['first', 'rows', 'sortField', 'sortOrder', 'multiSortMeta', 'filters', 'selection', 'columnLayout', 'collapsedGroups', 'expandedRows', 'expandedTree'] as const) {
        if (config[key] !== undefined) (out as Record<string, unknown>)[key] = config[key];
    }
    return out;
};

const cloneFilters = (filters?: FilterMeta | null): FilterMeta =>
    Object.fromEntries(Object.entries(filters ?? {}).map(([key, value]) => [key, isComposite(value) ? { ...value, constraints: value.constraints.map((c) => ({ ...c })) } : { ...value }]));

/** Filters as text, to tell whether two sets of them filter the same. */
const filtersKey = (filters: FilterMeta): string => JSON.stringify(filters ?? {});

/** `CSS.escape` where there is one, and a good enough escape where there is not. */
const cssEscape = (value: string): string => (typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(value) : value.replace(/["\\]/g, '\\$&'));

/** How many values a list filter draws at once; a search finds the rest. */
const LIST_LIMIT = 200;

/** A filter panel being worked in. */
interface FilterDraft {
    key: string;
    /** Drawn in the side bar's filters panel rather than hanging from the header. */
    inline?: boolean;
    kind: FilterKind;
    modes: string[];
    operator: 'and' | 'or';
    matchModes: [string, string];
    texts: [string, string];
    search: string;
    /** A list filter's values, their labels, the ones ticked and the ones drawn, by place. */
    options: unknown[];
    labels: string[];
    checked: Set<number>;
    shown: number[];
}
