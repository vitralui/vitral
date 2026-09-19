import {
    clampFirst,
    dropTarget,
    en,
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
    type FilterMeta,
    type Locale
} from '@vitral/core';
import { createRoot, partResolver } from '@vitral/dom';
import { datatableStyle, paginatorStyle } from '@vitral/styles';
import {
    allSelectedState,
    declaredColumns,
    defaultModels,
    hasActiveFilter,
    isComposite,
    loadRequest,
    modeOf,
    resolveRows,
    rowSelected,
    selectionKind,
    sortsOf,
    tableColumns,
    tableLayout,
    type ResolvedColumn
} from './engine/state';
import type { Row, TableConfig, TableModels } from './engine/types';
import { tableView, type TableActions, type ViewContext } from './render/table';

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

export interface TableHandle<T = Row> {
    /** Changes part of the configuration; what did not change is not redrawn. */
    update(config: Partial<TableConfig<T>>): void;
    /** The models as they stand: the page, the sort, the filters, the selection, the layout. */
    state(): TableModels;
    /** Draws again, for data that changed underneath. */
    refresh(): void;
    /** Removes everything this table added to the element. */
    destroy(): void;
    readonly element: HTMLElement;
}

let counter = 0;

export function createDataTable<T = Row>(element: HTMLElement, config: TableConfig<T> = {}): TableHandle<T> {
    let current: TableConfig<T> = { ...config };
    let models: TableModels = { ...defaultModels(), ...pickModels(config) };
    /** The filters the rows are computed from: at once for local data, after `filterDelay` for a server. */
    let applied: FilterMeta = cloneFilters(models.filters);
    let remote: { items: T[]; total: number } | undefined;
    let chooserOpen = false;
    let dragging: string | null = null;
    let dropOn: string | null = null;
    let activeRow = 0;
    let filterTimer: ReturnType<typeof setTimeout> | undefined;
    let sourceRun = 0;
    let shared: ColumnLayout | null = null;
    let echo = false;
    let stopGroup: (() => void) | null = null;

    const id = config.id ?? `vt-table-${++counter}`;
    const ids = { table: `${id}-table`, list: `${id}-columns`, caption: `${id}-caption` };
    const root = createRoot(element);
    const locale = (): Locale => current.locale ?? en;
    const part = partResolver({
        style: datatableStyle,
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

    if (!config.unstyled) {
        loadStyle(datatableStyle.name, datatableStyle.css, { nonce: config.nonce });
        if (config.paginator) loadStyle(paginatorStyle.name, paginatorStyle.css, { nonce: config.nonce });
    }

    // ---- what the host hears ------------------------------------------------------

    function emit<K extends keyof NonNullable<TableConfig<T>['on']>>(name: K, payload: Parameters<NonNullable<NonNullable<TableConfig<T>['on']>[K]>>[0]) {
        const handler = current.on?.[name] as ((value: unknown) => void) | undefined;
        handler?.(payload);
    }

    /** Every change to a model is published, so a host can bind them. */
    function change(next: Partial<TableModels>) {
        models = { ...models, ...next };
        current.on?.change?.({ ...models });
        render();
    }

    // ---- the rows -----------------------------------------------------------------

    const mode = () => modeOf(current);

    function requestSource() {
        const source = current.dataSource;
        if (!source) return;
        const run = ++sourceRun;
        const request = loadRequest(current, models, applied);
        void Promise.resolve(source.load(request)).then((answer) => {
            // A slow answer that arrives after a newer one is thrown away.
            if (run !== sourceRun) return;
            remote = answer as { items: T[]; total: number };
            render();
        });
        render();
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
            const rows = resolveRows(current, models, applied, remote);
            emit('filter', { filters: cloneFilters(next), filteredValue: mode() === 'local' ? rows.all : rows.page });
            requestRows();
            render();
        };
        const delay = current.filterDelay ?? 300;
        if (mode() !== 'local' && delay > 0) filterTimer = setTimeout(run, delay);
        else run();
    }

    // ---- what the reader does ------------------------------------------------------

    const actions: TableActions<T> = {
        sort(column, event) {
            const multiple = current.sortMode === 'multiple';
            const next = toggleSort(sortsOf(current, models), column.sortField, { multiple, additive: event.ctrlKey || event.metaKey, removable: current.removableSort });
            const models_: Partial<TableModels> = multiple
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
            const total = resolveRows(current, models, applied, remote).total;
            const next = clampFirst(first, rows, total);
            change({ first: next, rows });
            emit('page', { first: next, rows, page: pageOf(next, rows), pageCount: pageCount(total, rows) });
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
            const rows = resolveRows(current, models, applied, remote);
            const cover = mode() === 'local' ? rows.all : rows.page;
            const select = allSelectedState(current, models, cover) !== 'all';
            change({ selection: selectRows(models.selection, cover, select, current.dataKey) });
            emit(select ? 'row-select-all' : 'row-unselect-all', { originalEvent: event, data: cover });
        },
        rowClick(row, index, event) {
            const rows = resolveRows(current, models, applied, remote);
            emit('row-click', { originalEvent: event, data: row, index: rows.offset + index });
            if (!current.selectionMode) return;
            // A press on a control inside a cell is that control's, not the row's.
            if ((event.target as Element).closest('button, input, select, textarea, a, [role="button"]')) return;
            actions.toggleRow(row, rows.offset + index, event, 'row');
        },
        rowKeydown(event, index) {
            if (!current.selectionMode || event.target !== event.currentTarget) return;
            const rows = resolveRows(current, models, applied, remote);
            const last = rows.page.length - 1;
            const go = (to: number) => {
                event.preventDefault();
                activeRow = Math.max(0, Math.min(last, to));
                render();
                (element.querySelectorAll('tbody tr')[activeRow] as HTMLElement | undefined)?.focus();
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
            writeLayout({ ...tableLayout(current, models), widths: { ...start, ...tableLayout(current, models).widths } });
            let last = from;
            const move = (moved: PointerEvent) => {
                applyResize(column, (moved.clientX - last) * (rtl ? -1 : 1), next, start, moved);
                last = moved.clientX;
            };
            const stop = () => {
                document.removeEventListener('pointermove', move);
                document.removeEventListener('pointerup', stop);
                document.removeEventListener('pointercancel', stop);
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
            const cells = Array.from(element.querySelectorAll('thead tr:first-child th')) as HTMLElement[];
            const edges = columnsNow().map((column, index) => {
                const rect = cells[index]?.getBoundingClientRect();
                return { key: column.key, left: rect?.left ?? 0, right: rect?.right ?? 0 };
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
            const layout = { ...tableLayout(current, models), widths: { ...measured(), ...tableLayout(current, models).widths } };
            const next = pinColumn(layout, column.key, side);
            writeLayout(next);
            emit('column-pin', { originalEvent: event, key: column.key, side, layout: next });
        },
        setVisible(key, visible, event) {
            const next = toggleColumn(tableLayout(current, models), key, visible);
            writeLayout(next);
            emit('column-toggle', { originalEvent: event, key, visible, layout: next });
        },
        toggleChooser() {
            chooserOpen = !chooserOpen;
            render();
        },
        scrolled(event) {
            if (!current.group || echo) return;
            tableBus.publish(current.group, { kind: 'scroll', source: id, left: (event.currentTarget as HTMLElement).scrollLeft });
        }
    };

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
        const next = moveColumn(tableLayout(current, models), keys, key, before);
        if (!next.order) return;
        writeLayout(next);
        emit('column-reorder', { originalEvent: event, key, order: next.order, layout: next });
    }

    function applyResize(column: ResolvedColumn<T>, delta: number, next: string | undefined, start: Record<string, number>, event: Event) {
        if (!delta) return;
        const layout = resizeColumn(tableLayout(current, models), column.key, delta, {
            min: column.column.minWidth,
            mode: current.columnResizeMode ?? 'fit',
            next: (current.columnResizeMode ?? 'fit') === 'fit' ? next : undefined,
            measured: start
        });
        writeLayout(layout);
        emit('column-resize', { originalEvent: event, key: column.key, width: layout.widths?.[column.key] ?? 0, layout });
    }

    /** What each column measures right now, for arithmetic that needs a width the layout has not got. */
    function measured(): Record<string, number> {
        const cells = Array.from(element.querySelectorAll('thead tr:first-child th')) as HTMLElement[];
        return Object.fromEntries(columnsNow().map((column, index) => [column.key, Math.round(cells[index]?.getBoundingClientRect().width ?? 0)]));
    }

    const columnsNow = () => tableColumns(withShared(), models);

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

    /** The configuration as the group has agreed it, for the columns this table has. */
    function withShared(): TableConfig<T> {
        if (!current.group || !shared) return current;
        const keys = declaredColumns(current).map((entry) => entry.key);
        return { ...current, columnLayout: layoutFor(keys, shared, models.columnLayout) };
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
                const container = element.querySelector('.vt-datatable-table-container') as HTMLElement | null;
                if (container) container.scrollLeft = message.left;
                requestAnimationFrame(() => (echo = false));
            } else {
                shared = message.layout;
                render();
            }
        });
    }

    // ---- drawing --------------------------------------------------------------------

    function render() {
        const config_ = withShared();
        const columns = tableColumns(config_, models);
        const rows = resolveRows(config_, models, applied, remote);
        const kind = selectionKind(config_, columns);
        const cover = mode() === 'local' ? rows.all : rows.page;
        const declared = declaredColumns(config_);
        const layout = tableLayout(config_, models);
        const shownToggleable = declared.filter(({ column, key }) => column.toggleable !== false && !column.selectionMode && !(layout.hidden ?? []).includes(key));
        const context: ViewContext<T> = {
            config: config_,
            models,
            columns,
            rows,
            filters: models.filters,
            locale: locale(),
            ids,
            busy: !!current.loading || (mode() === 'source' && remote === undefined),
            part,
            pagePart,
            on: actions,
            allState: allSelectedState(config_, models, cover),
            selected: (row: T) => rowSelected(config_, models, kind, row),
            selectionKind: kind,
            sorts: sortsOf(config_, models),
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
            dropOn
        };
        const emptyMessage = current.emptyMessage ?? (hasActiveFilter(applied) ? locale().emptySearchMessage : locale().emptyMessage);
        root.attrs(
            part('root', {
                striped: config_.stripedRows,
                gridlines: config_.showGridlines,
                size: config_.size,
                scrollable: config_.scrollable,
                loading: context.busy
            })
        );
        root.render(tableView({ ...context, config: { ...config_, emptyMessage } }));
    }

    joinGroup();
    render();
    requestRows();

    return {
        element,
        update(next) {
            const wasGroup = current.group;
            current = { ...current, ...next };
            const changedModels = pickModels(next);
            if (Object.keys(changedModels).length) models = { ...models, ...changedModels };
            if ('filters' in changedModels) applied = cloneFilters(models.filters);
            if (current.group !== wasGroup) joinGroup();
            if (!current.unstyled && current.paginator) loadStyle(paginatorStyle.name, paginatorStyle.css, { nonce: current.nonce });
            if ('value' in next || 'dataSource' in next || 'lazy' in next) {
                if (current.dataSource) requestSource();
            }
            render();
        },
        state: () => ({ ...models }),
        refresh: render,
        destroy() {
            clearTimeout(filterTimer);
            stopGroup?.();
            root.clear();
        }
    };
}

const pickModels = (config: Partial<TableConfig>): Partial<TableModels> => {
    const out: Partial<TableModels> = {};
    for (const key of ['first', 'rows', 'sortField', 'sortOrder', 'multiSortMeta', 'filters', 'selection', 'columnLayout'] as const) {
        if (config[key] !== undefined) (out as Record<string, unknown>)[key] = config[key];
    }
    return out;
};

const cloneFilters = (filters?: FilterMeta | null): FilterMeta =>
    Object.fromEntries(Object.entries(filters ?? {}).map(([key, value]) => [key, isComposite(value) ? { ...value, constraints: value.constraints.map((c) => ({ ...c })) } : { ...value }]));

/** `CSS.escape` where there is one, and a good enough escape where there is not. */
const cssEscape = (value: string): string => (typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(value) : value.replace(/["\\]/g, '\\$&'));
