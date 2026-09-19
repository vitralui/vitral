<script setup lang="ts">
import {
    dropTarget,
    formatMessage,
    getField,
    isBlankFilter,
    isSelected,
    moveColumn,
    orderColumns,
    pinColumn,
    queryData,
    resizeColumn,
    selectionState,
    selectRows,
    layoutFor,
    stickyOffsets,
    tableBus,
    toggleColumn,
    toggleSelection,
    toggleSort,
    type ColumnLayout,
    type DataSource
} from '@vitral/core';
import { datatableStyle } from '@vitral/styles';
import { camelize, computed, Fragment, mergeProps, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, useAttrs, useId, watch, type FunctionalComponent, type VNode } from 'vue';
import { useComponent } from '../../base/useComponent';
import { useDataSource } from '../../composables/useDataSource';
import Icon from '../Icon/Icon.vue';
import InputText from '../InputText/InputText.vue';
import Paginator from '../Paginator/Paginator.vue';
import Popover from '../Popover/Popover.vue';
import Column from './Column.vue';
import { useDrag } from '../../base/useDrag';
import type {
    ColumnLayoutLike,
    CompositeFilterLike,
    DataTableEmits,
    DataTableFilterMeta,
    DataTableProps,
    DataTableSlots,
    FilterConstraintLike,
    LoadOptionsLike,
    SortMetaLike
} from './types';

// A real <table>: column headers are <th scope="col">, a sortable header holds
// a <button> and carries aria-sort, and every control inside (sort buttons,
// selection checkboxes, filter boxes, the paginator) is a native control in
// the tab order. Rows are focusable (one tab stop, arrows between them) only
// when the table itself selects rows. Full APG grid navigation is not
// attempted.
//
// Where the rows come from is one of three things, all described by the same
// LoadOptions: `value` queried here through core's queryData, `lazy` (emitted
// for the app to answer), or a core DataSource read through useDataSource.

defineOptions({ name: 'VtDataTable', inheritAttrs: false });

const props = withDefaults(defineProps<DataTableProps>(), {
    unstyled: undefined,
    value: () => [],
    sortMode: 'single',
    filterDelay: 300,
    pageLinkSize: 5,
    paginatorPosition: 'bottom',
    alwaysShowPaginator: true,
    columnResizeMode: 'fit'
});
const first = defineModel<number>('first', { default: 0 });
const rows = defineModel<number>('rows', { default: 10 });
const sortField = defineModel<string | null>('sortField', { default: null });
const sortOrder = defineModel<number | null>('sortOrder', { default: null });
const multiSortMeta = defineModel<SortMetaLike[] | null>('multiSortMeta', { default: null });
const filters = defineModel<DataTableFilterMeta>('filters');
const selection = defineModel<unknown>('selection');
// The layout is a plain object an application can store and hand back: the
// order, the widths, what is hidden and what is pinned.
const columnLayout = defineModel<ColumnLayoutLike | null>('columnLayout');
const emit = defineEmits<DataTableEmits>();
const slots = defineSlots<DataTableSlots>();

const { part, locale } = useComponent(datatableStyle, props);
const id = useId();

// Naming attributes belong to the <table>; everything else dresses the wrapper.
const attrs = useAttrs();
const TABLE_ATTRS = ['aria-label', 'aria-labelledby', 'aria-describedby'];
const rootAttrs = computed(() => Object.fromEntries(Object.entries(attrs).filter(([k]) => !TABLE_ATTRS.includes(k))));
const tableAttrs = computed(() => Object.fromEntries(Object.entries(attrs).filter(([k]) => TABLE_ATTRS.includes(k))));

// ---- columns, read from the <Column> vnodes -------------------------------------

type ColumnSlotFn = (props: Record<string, unknown>) => VNode[];

interface ColumnDef {
    key: string;
    field?: string;
    sortField: string;
    filterField: string;
    header?: string;
    footer?: string;
    sortable: boolean;
    selectionMode?: 'single' | 'multiple';
    align?: 'left' | 'center' | 'right';
    hidden: boolean;
    resizable?: boolean;
    minWidth?: number;
    width?: number;
    pinned?: 'left' | 'right';
    toggleable: boolean;
    filterPlaceholder?: string;
    filterMatchMode?: string;
    headerClass?: unknown;
    headerStyle?: unknown;
    bodyClass?: unknown;
    bodyStyle?: unknown;
    props: Record<string, unknown>;
    slots: Partial<Record<'body' | 'header' | 'footer' | 'filter', ColumnSlotFn>>;
}

// Template attributes arrive as written: `sort-field`, and `sortable` as ''.
const truthy = (v: unknown) => v === '' || v === true || v === 'true';

function toColumn(vnode: VNode, index: number): ColumnDef {
    const p: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(vnode.props ?? {})) p[camelize(k)] = v;
    const field = p.field as string | undefined;
    const children = vnode.children;
    return {
        key: String(p.columnKey ?? field ?? `column-${index}`),
        field,
        sortField: String(p.sortField ?? field ?? ''),
        filterField: String(p.filterField ?? field ?? ''),
        header: p.header as string | undefined,
        footer: p.footer as string | undefined,
        sortable: truthy(p.sortable),
        selectionMode: p.selectionMode as ColumnDef['selectionMode'],
        align: p.align as ColumnDef['align'],
        hidden: truthy(p.hidden),
        resizable: p.resizable === undefined ? undefined : truthy(p.resizable),
        minWidth: p.minWidth === undefined ? undefined : Number(p.minWidth),
        width: p.width === undefined ? undefined : Number(p.width),
        pinned: p.pinned as ColumnDef['pinned'],
        toggleable: p.toggleable === undefined ? !p.selectionMode : truthy(p.toggleable),
        filterPlaceholder: p.filterPlaceholder as string | undefined,
        filterMatchMode: p.filterMatchMode as string | undefined,
        headerClass: p.headerClass,
        headerStyle: p.headerStyle,
        bodyClass: p.bodyClass,
        bodyStyle: p.bodyStyle,
        props: p,
        slots: (children && typeof children === 'object' && !Array.isArray(children) ? children : {}) as ColumnDef['slots']
    };
}

const isColumn = (vnode: VNode) => vnode.type === Column || (vnode.type as { name?: string } | null)?.name === 'VtColumn';

function collect(nodes: unknown, out: ColumnDef[]) {
    if (!Array.isArray(nodes)) return;
    for (const node of nodes) {
        if (Array.isArray(node)) collect(node, out);
        else if (node && typeof node === 'object') {
            const vnode = node as VNode;
            if (isColumn(vnode)) out.push(toColumn(vnode, out.length));
            else if (vnode.type === Fragment) collect(vnode.children, out);
        }
    }
}

// Read while rendering (a computed first read by the template), so what the
// slot reads, a v-if or a bound header, is tracked like any other dependency.
/** Every column the slot declared, in the order it declared them. */
const declared = computed(() => {
    const out: ColumnDef[] = [];
    collect(slots.default?.(), out);
    return out.filter((c) => !c.hidden);
});

/*
 * The layout the table draws from: what the reader has changed, over what the
 * columns themselves asked for. A column's own `width` and `pinned` are the
 * starting point, so a table is laid out as written until someone moves
 * something.
 */
const layout = computed<ColumnLayout>(() => {
    const own = columnLayout.value ?? {};
    // What the group has agreed, for the columns this table has, over its own.
    const given = props.group ? layoutFor(declared.value.map((c) => c.key), shared.value, own) : own;
    const widths = { ...Object.fromEntries(declared.value.filter((c) => c.width !== undefined).map((c) => [c.key, c.width!])), ...given.widths };
    const pinned = { ...Object.fromEntries(declared.value.filter((c) => c.pinned).map((c) => [c.key, c.pinned!])), ...given.pinned };
    return { order: given.order, hidden: given.hidden ?? [], widths, pinned };
});

const columns = computed(() => {
    const byKey = new Map(declared.value.map((c) => [c.key, c]));
    return orderColumns(
        declared.value.map((c) => c.key),
        layout.value
    )
        .map((key) => byKey.get(key))
        .filter((c): c is ColumnDef => !!c);
});

/** What the reader can put back: the columns the layout is hiding. */
const hiddenColumns = computed(() => declared.value.filter((c) => (layout.value.hidden ?? []).includes(c.key)));

const headerText = (col: ColumnDef) => col.header ?? col.field ?? '';
const display = (value: unknown) => (value === null || value === undefined ? '' : value instanceof Date ? value.toLocaleDateString(locale.value.code) : String(value));
const VNodes: FunctionalComponent<{ vnodes: unknown }> = (p) => p.vnodes as VNode[];

// ---- sorting ----------------------------------------------------------------------

const multiSort = computed(() => props.sortMode === 'multiple');
const sorts = computed<SortMetaLike[]>(() => {
    if (multiSort.value) return multiSortMeta.value ?? [];
    const order = sortOrder.value;
    return sortField.value && (order === 1 || order === -1) ? [{ field: sortField.value, order }] : [];
});
const sortIndex = (col: ColumnDef) => sorts.value.findIndex((s) => s.field === col.sortField);
const sortIcon = (col: ColumnDef) => {
    const meta = sorts.value[sortIndex(col)];
    return !meta ? 'sort' : meta.order === 1 ? 'arrowUp' : 'arrowDown';
};
// ARIA asks for aria-sort on one header at a time: the primary sort. The others say it in text.
const ariaSort = (col: ColumnDef) => {
    const primary = sorts.value[0];
    return col.sortable && primary && primary.field === col.sortField ? (primary.order === 1 ? 'ascending' : 'descending') : undefined;
};

function onSort(col: ColumnDef, event: MouseEvent) {
    const next = toggleSort(sorts.value, col.sortField, { multiple: multiSort.value, additive: event.ctrlKey || event.metaKey, removable: props.removableSort });
    if (multiSort.value) multiSortMeta.value = next;
    else {
        sortField.value = next[0]?.field ?? null;
        sortOrder.value = next[0]?.order ?? null;
    }
    if (props.paginator) first.value = 0;
    emit('sort', { originalEvent: event, sortField: next[0]?.field ?? null, sortOrder: next[0]?.order ?? null, multiSortMeta: next });
}

// ---- filtering ----------------------------------------------------------------------

const remote = computed(() => !!props.dataSource || !!props.lazy);
const isComposite = (f: FilterConstraintLike | CompositeFilterLike): f is CompositeFilterLike => 'constraints' in f;
const cloneFilters = (f?: DataTableFilterMeta | null): DataTableFilterMeta =>
    Object.fromEntries(Object.entries(f ?? {}).map(([k, v]) => [k, isComposite(v) ? { ...v, constraints: v.constraints.map((c) => ({ ...c })) } : { ...v }]));

/** The filters the rows are computed from: at once for local data, after `filterDelay` for a server. */
const appliedFilters = shallowRef<DataTableFilterMeta>(cloneFilters(filters.value));
let filterTimer: ReturnType<typeof setTimeout> | undefined;

watch(
    filters,
    (f) => {
        clearTimeout(filterTimer);
        const apply = () => {
            appliedFilters.value = cloneFilters(f);
            if (props.paginator) first.value = 0;
            emit('filter', { filters: cloneFilters(f), filteredValue: mode.value === 'local' ? processed.value!.items : pageRows.value });
        };
        if (remote.value && props.filterDelay > 0) filterTimer = setTimeout(apply, props.filterDelay);
        else apply();
    },
    { deep: true }
);
onBeforeUnmount(() => clearTimeout(filterTimer));

const hasActiveFilter = computed(() => Object.values(appliedFilters.value).some((f) => (isComposite(f) ? f.constraints.some((c) => !isBlankFilter(c.value)) : !isBlankFilter(f.value))));

const isFilterable = (col: ColumnDef) => !col.selectionMode && !!col.filterField && (!!col.slots.filter || !!filters.value?.[col.filterField]);
const showFilterRow = computed(() => props.filterDisplay === 'row' && columns.value.some(isFilterable));

function filterText(col: ColumnDef): string {
    const f = filters.value?.[col.filterField];
    const value = !f ? undefined : isComposite(f) ? f.constraints[0]?.value : f.value;
    return value === null || value === undefined ? '' : String(value);
}

function setFilter(col: ColumnDef, value: string | null | undefined) {
    const current = filters.value ?? {};
    const existing = current[col.filterField];
    const entry: FilterConstraintLike | CompositeFilterLike =
        existing && isComposite(existing)
            ? { ...existing, constraints: [{ ...existing.constraints[0], value }, ...existing.constraints.slice(1)] }
            : { matchMode: col.filterMatchMode, ...existing, value };
    filters.value = { ...current, [col.filterField]: entry };
}

/** For a custom filter slot that changed `filterModel.value` on an object Vue does not track. */
const filterCallback = () => (filters.value = { ...(filters.value ?? {}) });

// ---- the rows ---------------------------------------------------------------------

const loadOptions = computed<LoadOptionsLike>(() => {
    const { global, ...fieldFilters } = appliedFilters.value;
    const globalFilter =
        global && !isComposite(global) && props.globalFilterFields?.length ? { value: global.value, fields: [...props.globalFilterFields], matchMode: global.matchMode } : undefined;
    return {
        first: props.paginator ? first.value : undefined,
        rows: props.paginator ? rows.value : undefined,
        sort: sorts.value.map((s) => ({ field: s.field, order: s.order })),
        filters: fieldFilters,
        globalFilter,
        locale: locale.value.code
    };
});

const mode = computed<'local' | 'lazy' | 'source'>(() => (props.dataSource ? 'source' : props.lazy ? 'lazy' : 'local'));
const source = useDataSource(() => (props.dataSource as DataSource<unknown> | undefined) ?? null, loadOptions);

/** Local rows filtered and sorted, before paging: what select-all covers and the paginator counts. */
const processed = computed(() => (mode.value === 'local' ? queryData(props.value, { ...loadOptions.value, first: undefined, rows: undefined }) : null));

const pageRows = computed<unknown[]>(() => {
    if (mode.value === 'lazy') return props.value;
    if (mode.value === 'source') return source.items.value;
    const all = processed.value!.items;
    return props.paginator ? queryData(all, { first: first.value, rows: rows.value }).items : all;
});

const total = computed(() => (mode.value === 'lazy' ? (props.totalRecords ?? props.value.length) : mode.value === 'source' ? source.total.value : processed.value!.total));
const busy = computed(() => props.loading || (mode.value === 'source' && source.loading.value));
const offset = computed(() => (props.paginator ? first.value : 0));
const rowKey = (row: unknown, i: number) => (props.dataKey ? String(getField(row, props.dataKey)) : offset.value + i);

watch(loadOptions, (options) => {
    if (mode.value === 'lazy') emit('lazy-load', options);
});
onMounted(() => {
    if (mode.value === 'lazy') emit('lazy-load', loadOptions.value);
});

const emptyText = computed(() => props.emptyMessage ?? (hasActiveFilter.value ? locale.value.emptySearchMessage : locale.value.emptyMessage));

// ---- selection ----------------------------------------------------------------------

const selectionColumn = computed(() => columns.value.find((c) => c.selectionMode));
const selectionKind = computed<'single' | 'multiple' | undefined>(() => selectionColumn.value?.selectionMode ?? props.selectionMode);
const rowSelectable = computed(() => !!props.selectionMode);
const isRowSelected = (row: unknown) => !!selectionKind.value && isSelected(selection.value, row, selectionKind.value, props.dataKey);

function toggleRow(row: unknown, index: number, event: Event, type: 'row' | 'checkbox' | 'radio') {
    const kind = selectionKind.value;
    if (!kind) return;
    const was = isRowSelected(row);
    selection.value = toggleSelection(selection.value, row, kind, props.dataKey);
    const payload = { originalEvent: event, data: row, index, type };
    if (was) emit('row-unselect', payload);
    else emit('row-select', payload);
}

const selectAllRows = computed(() => (mode.value === 'local' ? processed.value!.items : pageRows.value));
const allState = computed(() => selectionState(selectAllRows.value, selection.value, props.dataKey));

function toggleAll(event: Event) {
    const select = allState.value !== 'all';
    selection.value = selectRows(selection.value, selectAllRows.value, select, props.dataKey);
    const payload = { originalEvent: event, data: selectAllRows.value };
    if (select) emit('row-select-all', payload);
    else emit('row-unselect-all', payload);
}

function onRowClick(row: unknown, i: number, event: MouseEvent) {
    emit('row-click', { originalEvent: event, data: row, index: offset.value + i });
    if (!rowSelectable.value) return;
    // A press on a control inside a cell is that control's, not the row's.
    if ((event.target as Element).closest('button, input, select, textarea, a, [role="button"]')) return;
    toggleRow(row, offset.value + i, event, 'row');
}

// ---- row focus ----------------------------------------------------------------------

const tbodyRef = ref<HTMLTableSectionElement | null>(null);
const activeRow = ref(0);
const tabRow = computed(() => Math.min(activeRow.value, Math.max(0, pageRows.value.length - 1)));

function focusRow(i: number) {
    const el = tbodyRef.value?.rows[i];
    if (!el) return;
    activeRow.value = i;
    el.focus();
}

function onRowKeydown(event: KeyboardEvent, row: unknown, i: number) {
    if (!rowSelectable.value || event.target !== event.currentTarget) return;
    const last = pageRows.value.length - 1;
    switch (event.key) {
        case 'ArrowDown':
            event.preventDefault();
            focusRow(Math.min(i + 1, last));
            break;
        case 'ArrowUp':
            event.preventDefault();
            focusRow(Math.max(i - 1, 0));
            break;
        case 'Home':
            event.preventDefault();
            focusRow(0);
            break;
        case 'End':
            event.preventDefault();
            focusRow(last);
            break;
        case ' ':
        case 'Enter':
            event.preventDefault();
            toggleRow(row, offset.value + i, event, 'row');
            break;
    }
}

// ---- state for the class map ---------------------------------------------------------

const rootState = computed(() => ({
    striped: props.stripedRows,
    gridlines: props.showGridlines,
    size: props.size,
    scrollable: props.scrollable,
    flexScroll: props.scrollable && props.scrollHeight === 'flex',
    loading: busy.value
}));
const containerStyle = computed(() => (props.scrollable && props.scrollHeight && props.scrollHeight !== 'flex' ? { maxHeight: props.scrollHeight } : undefined));
const hasFooter = computed(() => columns.value.some((c) => c.footer !== undefined || c.slots.footer));

// ---- the reader's own column layout ---------------------------------------------

const headRowRef = ref<HTMLTableRowElement | null>(null);
/** What each column measures right now, for arithmetic that needs a width the layout has not got. */
function measured(): Record<string, number> {
    const cells = Array.from(headRowRef.value?.children ?? []) as HTMLElement[];
    return Object.fromEntries(columns.value.map((col, i) => [col.key, Math.round(cells[i]?.getBoundingClientRect().width ?? 0)]));
}

function write(next: ColumnLayout) {
    columnLayout.value = next as ColumnLayoutLike;
    if (props.group) {
        tableBus.lastLayout.set(props.group, next);
        tableBus.publish(props.group, { kind: 'layout', source: id, layout: next });
    }
}
const sticky = computed(() => stickyOffsets(columns.value.map((c) => c.key), layout.value, {}, 0));
const canResize = (col: ColumnDef) => !!props.resizableColumns && col.resizable !== false;
const canReorder = (col: ColumnDef) => !!props.reorderableColumns && !col.selectionMode;

/** A column's width, from the layout; a pinned column always has one, since it is what the next one stands on. */
const widthOf = (col: ColumnDef) => layout.value.widths?.[col.key];

// ---- resizing

let drag: { key: string; next?: string; from: number; start: Record<string, number> } | null = null;
const resizeDrag = useDrag();

function onResizeStart(col: ColumnDef, event: PointerEvent) {
    const index = columns.value.indexOf(col);
    const start = measured();
    drag = { key: col.key, next: columns.value[index + 1]?.key, from: event.clientX, start };
    // The widths every column measures become the layout's, so the ones that
    // were laid out by the table do not jump when one of them is given a size.
    write({ ...layout.value, widths: { ...start, ...layout.value.widths } });
    // Followed from the document: the header is redrawn on every step, and a
    // capture on it does not survive that in every engine.
    const rtl = getComputedStyle(event.currentTarget as Element).direction === 'rtl';
    resizeDrag.track(event.pointerId, { move: (move) => onResizeMove(move, rtl), end: onResizeEnd });
    event.preventDefault();
}

function onResizeMove(event: PointerEvent, rtl: boolean) {
    if (!drag) return;
    const delta = (event.clientX - drag.from) * (rtl ? -1 : 1);
    applyResize(drag.key, delta, drag.next, drag.start, event);
    drag = { ...drag, from: event.clientX };
}

function onResizeEnd() {
    if (!drag) return;
    resizeDrag.release();
    drag = null;
}

function applyResize(key: string, delta: number, next: string | undefined, start: Record<string, number>, event: Event) {
    if (!delta) return;
    const col = columns.value.find((c) => c.key === key);
    const next_ = props.columnResizeMode === 'fit' ? next : undefined;
    const layoutNext = resizeColumn(layout.value, key, delta, { min: col?.minWidth, mode: props.columnResizeMode, next: next_, measured: start });
    write(layoutNext);
    emit('column-resize', { originalEvent: event, key, width: layoutNext.widths?.[key] ?? 0, layout: layoutNext });
}

/** The keyboard resizes in steps, as the splitter's gutter does. */
function onResizeKeydown(col: ColumnDef, event: KeyboardEvent) {
    const step = event.shiftKey ? 48 : 16;
    const rtl = getComputedStyle(event.currentTarget as Element).direction === 'rtl';
    const delta = event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0;
    if (!delta) return;
    event.preventDefault();
    const index = columns.value.indexOf(col);
    applyResize(col.key, delta * (rtl ? -1 : 1), columns.value[index + 1]?.key, measured(), event);
}

// ---- moving

const dragging = ref<string | null>(null);
const dropOn = ref<string | null>(null);

function onColumnDragStart(col: ColumnDef, event: DragEvent) {
    if (!canReorder(col)) return;
    dragging.value = col.key;
    event.dataTransfer?.setData('text/plain', col.key);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
}

function onColumnDragOver(event: DragEvent) {
    if (!dragging.value) return;
    event.preventDefault();
    const cells = Array.from(headRowRef.value?.children ?? []) as HTMLElement[];
    const edges = columns.value.map((col, i) => {
        const rect = cells[i]?.getBoundingClientRect();
        return { key: col.key, left: rect?.left ?? 0, right: rect?.right ?? 0 };
    });
    dropOn.value = dropTarget(edges, event.clientX);
}

function onColumnDrop(event: DragEvent) {
    const key = dragging.value;
    dragging.value = null;
    const before = dropOn.value;
    dropOn.value = null;
    if (!key) return;
    event.preventDefault();
    move(key, before, event);
}

function move(key: string, before: string | null, event: Event) {
    const keys = declared.value.map((c) => c.key);
    const next = moveColumn(layout.value, keys, key, before);
    if (!next.order) return;
    write(next);
    emit('column-reorder', { originalEvent: event, key, order: next.order, layout: next });
}

/** Ctrl (or Cmd) and an arrow moves the column the header belongs to. */
function onHeaderKeydown(col: ColumnDef, event: KeyboardEvent) {
    if (!canReorder(col) || !(event.ctrlKey || event.metaKey)) return;
    const rtl = getComputedStyle(event.currentTarget as Element).direction === 'rtl';
    const back = event.key === (rtl ? 'ArrowRight' : 'ArrowLeft');
    const forward = event.key === (rtl ? 'ArrowLeft' : 'ArrowRight');
    if (!back && !forward) return;
    event.preventDefault();
    const order = columns.value.map((c) => c.key);
    const at = order.indexOf(col.key);
    const target = back ? order[at - 1] : order[at + 2];
    if (back && at === 0) return;
    if (forward && at >= order.length - 1) return;
    move(col.key, target ?? null, event);
    // The header keeps the keyboard: it moved, so the button moved with it.
    nextTick(() => (headRowRef.value?.querySelector(`[data-column="${CSS.escape(col.key)}"] button`) as HTMLElement | null)?.focus());
}

// ---- pinning and hiding

function setPinned(col: ColumnDef, side: 'left' | 'right' | null, event: Event) {
    const widths = { ...measured(), ...layout.value.widths };
    const next = pinColumn({ ...layout.value, widths }, col.key, side);
    write(next);
    emit('column-pin', { originalEvent: event, key: col.key, side, layout: next });
}

function setVisible(col: ColumnDef, visible: boolean, event: Event) {
    const next = toggleColumn(layout.value, col.key, visible);
    write(next);
    emit('column-toggle', { originalEvent: event, key: col.key, visible, layout: next });
}

// ---- tables that work together --------------------------------------------------

/*
 * A group is a name two tables share: one above another, read as one thing.
 * What travels between them is about the columns — the sideways scroll and the
 * layout — so they stay lined up; the rows are each table's own.
 */
const containerRef = ref<HTMLElement | null>(null);
const shared = ref<ColumnLayout | null>(props.group ? (tableBus.lastLayout.get(props.group) ?? null) : null);
let echo = false;

function onContainerScroll(event: Event) {
    if (!props.group || echo) return;
    tableBus.publish(props.group, { kind: 'scroll', source: id, left: (event.currentTarget as HTMLElement).scrollLeft });
}

watch(
    () => props.group,
    (group, _old, onCleanup) => {
        if (!group) return;
        shared.value = tableBus.lastLayout.get(group) ?? null;
        const stop = tableBus.subscribe(group, (message) => {
            if (message.source === id) return;
            if (message.kind === 'scroll') {
                // The echo guard stops the answer coming back as a new message.
                echo = true;
                if (containerRef.value) containerRef.value.scrollLeft = message.left;
                requestAnimationFrame(() => (echo = false));
            } else shared.value = message.layout;
        });
        onCleanup(stop);
    },
    { immediate: true }
);

const chooserRef = ref<InstanceType<typeof Popover> | null>(null);
const chooserId = `${id}-columns`;
/** Every column the reader may show or hide, in the order they were declared. */
const toggleable = computed(() => declared.value.filter((c) => c.toggleable));
const isShown = (col: ColumnDef) => !(layout.value.hidden ?? []).includes(col.key);
/*
 * A pinned column stands still while the rest scrolls, and the offsets say
 * where. `left` and `right` are read as the leading and trailing edge, which is
 * what they are in the order the columns are drawn in — so in a right-to-left
 * table a left-pinned column sticks to the right, where it is also drawn first.
 */
const stickyStyle = (col: ColumnDef): Record<string, string> | undefined => {
    const at = sticky.value[col.key];
    if (!at) return undefined;
    return { position: 'sticky', [at.side === 'left' ? 'insetInlineStart' : 'insetInlineEnd']: `${at.offset}px`, zIndex: '1' };
};
const columnStyle = (col: ColumnDef): Record<string, unknown> => {
    const width = widthOf(col);
    return { ...(width ? { width: `${width}px`, minWidth: `${width}px` } : {}), ...stickyStyle(col) };
};
const pinnedState = (col: ColumnDef) => ({ pinned: sticky.value[col.key]?.side, pinnedEdge: sticky.value[col.key]?.last });

const headerAttrs = (col: ColumnDef) =>
    mergeProps(
        part('headerCell', { sortable: col.sortable, sorted: sortIndex(col) >= 0, align: col.align, ...pinnedState(col), dropping: dropOn.value === col.key, dragging: dragging.value === col.key }),
        { 'data-column': col.key, style: columnStyle(col) },
        { class: col.headerClass, style: col.headerStyle } as Record<string, unknown>
    );
const cellAttrs = (col: ColumnDef) =>
    mergeProps(
        part('bodyCell', { align: col.align, ...pinnedState(col) }),
        { style: stickyStyle(col) },
        col.selectionMode ? part('selectionCell') : {},
        { class: col.bodyClass, style: col.bodyStyle } as Record<string, unknown>
    );
const rowAttrs = (row: unknown) =>
    mergeProps(part('row', { selectable: rowSelectable.value, selected: isRowSelected(row) }), { class: props.rowClass?.(row) } as Record<string, unknown>);
const paginatorAttrs = (position: 'top' | 'bottom') => ({
    totalRecords: total.value,
    rowsPerPageOptions: props.rowsPerPageOptions,
    pageLinkSize: props.pageLinkSize,
    template: props.paginatorTemplate,
    currentPageReportTemplate: props.currentPageReportTemplate,
    alwaysShow: props.alwaysShowPaginator,
    ...part('paginator', { position })
});

defineExpose({ reload: () => source.reload() });
</script>

<template>
    <div v-bind="mergeProps(rootAttrs, part('root', rootState))">
        <div v-if="$slots.header || columnToggle" v-bind="part('header')">
            <slot name="header" />
            <template v-if="columnToggle">
                <button type="button" v-bind="part('chooserButton')" :aria-controls="chooserId" @click="chooserRef?.toggle($event)">
                    <Icon icon="sliders" />
                    <span>{{ locale.aria.chooseColumns }}</span>
                </button>
                <Popover :id="chooserId" ref="chooserRef" :aria-label="locale.aria.columns">
                    <ul v-bind="part('chooserList')">
                        <li v-for="col in toggleable" :key="col.key" v-bind="part('chooserItem')">
                            <label v-bind="part('chooserLabel')">
                                <input
                                    type="checkbox"
                                    :checked="isShown(col)"
                                    :disabled="isShown(col) && columns.filter((c) => c.toggleable).length === 1"
                                    v-bind="part('chooserCheckbox')"
                                    @change="setVisible(col, ($event.target as HTMLInputElement).checked, $event)"
                                />
                                <span>{{ headerText(col) }}</span>
                            </label>
                        </li>
                    </ul>
                </Popover>
            </template>
        </div>
        <Paginator v-if="paginator && paginatorPosition === 'top'" v-model:first="first" v-model:rows="rows" v-bind="paginatorAttrs('top')" @page="emit('page', $event)">
            <template v-if="$slots.paginatorstart" #start="s"><slot name="paginatorstart" v-bind="s" /></template>
            <template v-if="$slots.paginatorend" #end="s"><slot name="paginatorend" v-bind="s" /></template>
        </Paginator>
        <div ref="containerRef" v-bind="part('tableContainer', rootState)" :style="containerStyle" @scroll="onContainerScroll">
            <table v-bind="mergeProps(tableAttrs, part('table'))" :style="tableStyle" :aria-busy="busy ? 'true' : undefined">
                <caption v-if="caption" v-bind="part(showCaption ? 'caption' : 'hiddenCaption')">{{ caption }}</caption>
                <thead v-bind="part('thead')">
                    <tr ref="headRowRef" v-bind="part('headerRow')" @dragover="onColumnDragOver" @drop="onColumnDrop">
                        <th
                            v-for="col in columns"
                            :key="col.key"
                            scope="col"
                            v-bind="headerAttrs(col)"
                            :aria-sort="ariaSort(col)"
                            :draggable="canReorder(col) || undefined"
                            @dragstart="onColumnDragStart(col, $event)"
                            @dragend="dragging = null"
                            @keydown="onHeaderKeydown(col, $event)"
                        >
                            <span v-if="col.selectionMode === 'multiple'" v-bind="part('checkbox')">
                                <input
                                    type="checkbox"
                                    v-bind="part('checkboxInput')"
                                    :checked="allState === 'all'"
                                    :indeterminate="allState === 'some'"
                                    :disabled="!selectAllRows.length"
                                    :aria-label="locale.aria.selectAll"
                                    @change="toggleAll"
                                />
                                <Icon v-if="allState !== 'none'" :icon="allState === 'all' ? 'check' : 'minus'" v-bind="part('checkboxIcon')" />
                            </span>
                            <span v-else-if="col.selectionMode" v-bind="part('selectionHeaderText')">{{ locale.aria.selectRow }}</span>
                            <button v-else-if="col.sortable" type="button" v-bind="part('sortButton')" @click="onSort(col, $event)">
                                <span v-bind="part('headerTitle')">
                                    <VNodes v-if="col.slots.header" :vnodes="col.slots.header({ column: col.props })" />
                                    <template v-else>{{ headerText(col) }}</template>
                                </span>
                                <Icon :icon="sortIcon(col)" v-bind="part('sortIcon', { active: sortIndex(col) >= 0 })" />
                                <span v-if="multiSort && sorts.length > 1 && sortIndex(col) >= 0" v-bind="part('sortBadge')" aria-hidden="true">{{ sortIndex(col) + 1 }}</span>
                                <span v-if="sortIndex(col) > 0" v-bind="part('sortStatus')">{{ sorts[sortIndex(col)]!.order === 1 ? locale.aria.sortAscending : locale.aria.sortDescending }}</span>
                            </button>
                            <template v-else>
                                <VNodes v-if="col.slots.header" :vnodes="col.slots.header({ column: col.props })" />
                                <template v-else>{{ headerText(col) }}</template>
                            </template>
                            <span
                                v-if="canResize(col)"
                                role="separator"
                                tabindex="0"
                                aria-orientation="vertical"
                                :aria-label="formatMessage(locale.aria.resizeColumn, { column: headerText(col) })"
                                v-bind="part('resizer')"
                                @pointerdown="onResizeStart(col, $event)"
                                @keydown="onResizeKeydown(col, $event)"
                                @dblclick="setPinned(col, sticky[col.key] ? null : 'left', $event)"
                            />
                        </th>
                    </tr>
                    <tr v-if="showFilterRow" v-bind="part('filterRow')">
                        <td v-for="col in columns" :key="col.key" v-bind="mergeProps(part('filterCell', { align: col.align, ...pinnedState(col) }), { style: stickyStyle(col) })">
                            <template v-if="isFilterable(col)">
                                <VNodes
                                    v-if="col.slots.filter"
                                    :vnodes="col.slots.filter({ field: col.filterField, filterModel: filters?.[col.filterField], filterCallback })"
                                />
                                <InputText
                                    v-else
                                    v-bind="part('filterInput')"
                                    size="small"
                                    type="search"
                                    :model-value="filterText(col)"
                                    :placeholder="col.filterPlaceholder"
                                    :aria-label="formatMessage(locale.aria.filterColumn, { column: headerText(col) })"
                                    @update:model-value="setFilter(col, $event)"
                                />
                            </template>
                        </td>
                    </tr>
                </thead>
                <tbody ref="tbodyRef" v-bind="part('tbody')">
                    <template v-if="pageRows.length">
                        <tr
                            v-for="(row, i) in pageRows"
                            :key="rowKey(row, i)"
                            v-bind="rowAttrs(row)"
                            :tabindex="rowSelectable ? (i === tabRow ? 0 : -1) : undefined"
                            :aria-selected="selectionKind ? (isRowSelected(row) ? 'true' : 'false') : undefined"
                            @click="onRowClick(row, i, $event)"
                            @keydown="onRowKeydown($event, row, i)"
                            @focus="activeRow = i"
                        >
                            <td v-for="col in columns" :key="col.key" v-bind="cellAttrs(col)">
                                <span v-if="col.selectionMode === 'multiple'" v-bind="part('checkbox')">
                                    <input
                                        type="checkbox"
                                        v-bind="part('checkboxInput')"
                                        :checked="isRowSelected(row)"
                                        :aria-label="locale.aria.selectRow"
                                        @change="toggleRow(row, offset + i, $event, 'checkbox')"
                                    />
                                    <Icon v-if="isRowSelected(row)" icon="check" v-bind="part('checkboxIcon')" />
                                </span>
                                <span v-else-if="col.selectionMode === 'single'" v-bind="part('checkbox')">
                                    <input
                                        type="radio"
                                        :name="`${id}-selection`"
                                        v-bind="part('checkboxInput')"
                                        :checked="isRowSelected(row)"
                                        :aria-label="locale.aria.selectRow"
                                        @change="toggleRow(row, offset + i, $event, 'radio')"
                                    />
                                </span>
                                <VNodes v-else-if="col.slots.body" :vnodes="col.slots.body({ data: row, field: col.field, index: offset + i, column: col.props })" />
                                <template v-else>{{ display(getField(row, col.field)) }}</template>
                            </td>
                        </tr>
                    </template>
                    <tr v-else v-bind="part('emptyRow')">
                        <td :colspan="columns.length || 1" v-bind="part('emptyCell')">
                            <slot name="empty">{{ emptyText }}</slot>
                        </td>
                    </tr>
                </tbody>
                <tfoot v-if="hasFooter" v-bind="part('tfoot')">
                    <tr v-bind="part('footerRow')">
                        <td v-for="col in columns" :key="col.key" v-bind="mergeProps(part('footerCell', { align: col.align, ...pinnedState(col) }), { style: stickyStyle(col) })">
                            <VNodes v-if="col.slots.footer" :vnodes="col.slots.footer({ column: col.props })" />
                            <template v-else>{{ col.footer }}</template>
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
        <Paginator v-if="paginator && paginatorPosition !== 'top'" v-model:first="first" v-model:rows="rows" v-bind="paginatorAttrs('bottom')" @page="emit('page', $event)">
            <template v-if="$slots.paginatorstart" #start="s"><slot name="paginatorstart" v-bind="s" /></template>
            <template v-if="$slots.paginatorend" #end="s"><slot name="paginatorend" v-bind="s" /></template>
        </Paginator>
        <div v-if="$slots.footer" v-bind="part('footer')"><slot name="footer" /></div>
        <div v-if="busy" role="status" v-bind="part('loadingMask')">
            <slot name="loadingicon"><Icon icon="spinner" spin v-bind="part('loadingIcon')" /></slot>
            <span v-bind="part('loadingText')">{{ locale.loading }}</span>
        </div>
    </div>
</template>
