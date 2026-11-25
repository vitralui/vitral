<script setup lang="ts">
import { setField } from '@vitral/core';
import { createDataGrid, type CellContext, type EditorContext, type PageContext, type RowsPerPageContext, type DataGridColumn, type DataGridConfig, type DataGridHandle, type DataGridModels } from '@vitral/datagrid';
import { mergeAttrs, type PassThrough, type PassThroughContext as DomPassThroughContext } from '@vitral/dom';
import { flattenTokens, type TokenTree } from '@vitral/themes';
import {
    camelize,
    defineComponent,
    Fragment,
    getCurrentInstance,
    h,
    normalizeClass,
    normalizeStyle,
    onBeforeUnmount,
    onMounted,
    onUpdated,
    reactive,
    render,
    shallowRef,
    toRaw,
    useAttrs,
    useId,
    watch,
    type ComponentInternalInstance,
    type Slots,
    type VNode
} from 'vue';
import { collectParts, contentOf } from '../../base/parts';
import type { PassThroughAttrs, PassThroughContext, PassThroughValue } from '../../base/types';
import { useOverlayTarget } from '../../composables/useOverlayTarget';
import { useVitral } from '../../config/config';
import Select from '../Select/Select.vue';
import Column from './Column.vue';
import ColumnGroup from './ColumnGroup.vue';
import type { ColumnLayoutLike, DataGridEmits, DataGridFilterEvent, DataGridFilterMeta, DataGridPivot, DataGridProps, DataGridSlots, DataGridSortEvent, SortMetaLike } from './types';

// The table is `@vitral/datagrid`'s framework-free renderer; this component
// only hands it the props, the columns the `<Column>`s declared, the Vitral
// configuration (locale, unstyled, pass-through, the overlay host, the theme)
// and the slots, and turns its events into emits. The element it renders
// becomes the table's root, so what is drawn — a real <table>, its headers,
// its controls and their keyboard — is the addon's, and the same table can be
// drawn by React, by Angular or by a page with no framework at all.

defineOptions({ name: 'VtDataGrid', inheritAttrs: false });

const props = withDefaults(defineProps<DataGridProps>(), {
    unstyled: undefined,
    value: () => [],
    sortMode: 'single',
    filterDelay: 300,
    pageLinkSize: 5,
    paginatorPosition: 'bottom',
    alwaysShowPaginator: true,
    columnResizeMode: 'fit',
    // A boolean prop left out is false to Vue; undo is on unless turned off.
    undoRedo: true,
    clipboard: true,
    flashCells: undefined,
    columnInfo: true
});
const first = defineModel<number>('first', { default: 0 });
const rows = defineModel<number>('rows', { default: 10 });
const sortField = defineModel<string | null>('sortField', { default: null });
const sortOrder = defineModel<number | null>('sortOrder', { default: null });
const multiSortMeta = defineModel<SortMetaLike[] | null>('multiSortMeta', { default: null });
const filters = defineModel<DataGridFilterMeta>('filters');
const selection = defineModel<unknown>('selection');
// The layout is a plain object an application can store and hand back: the
// order, the widths, what is hidden and what is pinned.
const columnLayout = defineModel<ColumnLayoutLike | null>('columnLayout');
const collapsedGroups = defineModel<string[] | null>('collapsedGroups');
const expandedRows = defineModel<(string | number)[] | null>('expandedRows');
const expandedTree = defineModel<(string | number)[] | null>('expandedTree');
const emit = defineEmits<DataGridEmits>();
const slots = defineSlots<DataGridSlots>();

const { config, theme } = useVitral();
const overlayTarget = useOverlayTarget();
const attrs = useAttrs();
const id = useId();
const instance = getCurrentInstance()!;
const host = shallowRef<HTMLElement | null>(null);
let table: DataGridHandle | null = null;

const unstyled = () => props.unstyled ?? config.unstyled;

// ---- columns, read from the <Column> vnodes -------------------------------------

type ColumnSlotFn = (props: Record<string, unknown>) => VNode[];

interface ColumnDef {
    key: string;
    props: Record<string, unknown>;
    slots: Partial<Record<'body' | 'header' | 'footer' | 'filter' | 'skeleton' | 'editor' | 'aggregate' | 'description' | 'filteroption' | 'default', ColumnSlotFn>>;
    /** A `<ColumnGroup>`'s own columns. */
    children?: ColumnDef[];
}

// Template attributes arrive as written: `sort-field`, and `sortable` as ''.
const truthy = (v: unknown) => v === '' || v === true || v === 'true';
const maybe = (v: unknown) => (v === undefined ? undefined : truthy(v));
const size = (v: unknown) => (v === undefined ? undefined : Number(v));

function toColumn(vnode: VNode, index: number): ColumnDef {
    const p: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(vnode.props ?? {})) p[camelize(k)] = v;
    const children = vnode.children;
    return {
        key: String(p.columnKey ?? p.field ?? `column-${index}`),
        props: p,
        slots: (children && typeof children === 'object' && !Array.isArray(children) ? children : {}) as ColumnDef['slots']
    };
}

const isColumn = (vnode: VNode) => vnode.type === Column || (vnode.type as { name?: string } | null)?.name === 'VtColumn';
const isGroup = (vnode: VNode) => vnode.type === ColumnGroup || (vnode.type as { name?: string } | null)?.name === 'VtColumnGroup';

/** The parts the template wrote as children, by name, from the last read. */
const parts = shallowRef<Map<string, Slots>>(new Map());

/**
 * The `<Column>`s, and the `<ColumnGroup>`s with theirs inside. A column is
 * keyed by its place among every column, groups or not, as the table keys it.
 */
function collect(nodes: unknown, out: ColumnDef[], found: Map<string, Slots>, count = { columns: 0 }) {
    collectParts(nodes, found, (vnode) => {
        if (isColumn(vnode)) out.push(toColumn(vnode, count.columns++));
        else if (isGroup(vnode)) {
            const group = toColumn(vnode, 0);
            group.key = String(group.props.columnKey ?? '');
            group.children = [];
            collect(group.slots.default?.({}), group.children, found, count);
            out.push(group);
        }
    });
}

/** What one `<Column>` declared, as the table reads a column; a `<ColumnGroup>` as a column of columns. */
function toTableColumn(def: ColumnDef): DataGridColumn {
    const p = def.props;
    if (def.children) {
        return {
            key: def.key || undefined,
            header: p.header as string | undefined,
            align: p.align as 'left' | 'center' | 'right' | undefined,
            hidden: truthy(p.hidden),
            headerClass: normalizeClass(p.headerClass) || undefined,
            headerStyle: normalizeStyle(p.headerStyle) as Record<string, string> | undefined,
            headerContent: def.slots.header && (() => node(`group-header:${def.key || p.header}`, () => def.slots.header!({ column: p }))),
            columns: def.children.map(toTableColumn)
        };
    }
    const field = p.field as string | undefined;
    const own = def.slots;
    return {
        key: def.key,
        field,
        header: p.header as string | undefined,
        description: p.description as string | undefined,
        formula: p.formula as string | undefined,
        kind: p.kind as DataGridColumn['kind'],
        source: p.source as string | undefined,
        notes: p.notes as DataGridColumn['notes'],
        footer: p.footer as string | undefined,
        // Left unsaid rather than false, so the grid's columnDefaults can give it.
        sortable: maybe(p.sortable),
        sortField: p.sortField as string | undefined,
        filterField: p.filterField as string | undefined,
        filterPlaceholder: p.filterPlaceholder as string | undefined,
        filterMatchMode: p.filterMatchMode as string | undefined,
        // `filter` alone on a column is an empty string: a filter whose kind is read from the values.
        filter: p.filter === '' ? true : (p.filter as DataGridColumn['filter']),
        filterOptions: p.filterOptions as DataGridColumn['filterOptions'],
        filterLabel: p.filterLabel as DataGridColumn['filterLabel'],
        filterMatchModes: p.filterMatchModes as string[] | undefined,
        menu: p.menu === undefined ? undefined : truthy(p.menu),
        selectionMode: p.selectionMode as 'single' | 'multiple' | undefined,
        align: p.align as 'left' | 'center' | 'right' | undefined,
        hidden: truthy(p.hidden),
        visible: maybe(p.visible),
        resizable: maybe(p.resizable),
        minWidth: size(p.minWidth),
        flex: p.flex === undefined ? undefined : Number(p.flex),
        width: size(p.width),
        pinned: p.pinned as 'left' | 'right' | undefined,
        toggleable: p.toggleable === undefined ? !p.selectionMode && !p.expander && !truthy(p.rowNumber) : truthy(p.toggleable),
        expander: truthy(p.expander),
        exportable: p.exportable === undefined ? undefined : truthy(p.exportable),
        exportValue: p.exportValue as DataGridColumn['exportValue'],
        exportHeader: p.exportHeader as string | undefined,
        editable: p.editable === undefined ? undefined : typeof p.editable === 'function' ? (p.editable as (row: unknown) => boolean) : truthy(p.editable),
        parseValue: p.parseValue as DataGridColumn['parseValue'],
        validate: p.validate as DataGridColumn['validate'],
        // Written through the row's reactive proxy by default, so the rest of the page sees the change.
        setValue: (p.setValue as DataGridColumn['setValue']) ?? (field ? (row: unknown, value: unknown) => setField(reactive(row as object), field, value) : undefined),
        rowEditor: truthy(p.rowEditor),
        aggregate: p.aggregate as DataGridColumn['aggregate'],
        aggregateContent: own.aggregate && ((context: { value: unknown; rows: unknown[] }) => node(`aggregate:${def.key}:${context.rows.length}:${String(context.value)}`, () => own.aggregate!({ value: context.value, rows: context.rows, column: p }))),
        rowDrag: truthy(p.rowDrag),
        sparkline: p.sparkline as DataGridColumn['sparkline'],
        colSpan: p.colSpan as DataGridColumn['colSpan'],
        // A bare `span-rows` merges equal values; a function says which go together.
        spanRows: typeof p.spanRows === 'function' ? (p.spanRows as DataGridColumn['spanRows']) : p.spanRows === undefined ? undefined : truthy(p.spanRows),
        spanRowsSticky: maybe(p.spanRowsSticky),
        headerToolsAt: p.headerToolsAt as 'edge' | 'title' | undefined,
        headerInfoAt: p.headerInfoAt as 'edge' | 'title' | undefined,
        dictionary: maybe(p.dictionary),
        stackLabel: p.stackLabel as string | false | undefined,
        rowNumber: truthy(p.rowNumber),
        valueGetter: p.valueGetter as DataGridColumn['valueGetter'],
        valueFormatter: p.valueFormatter as DataGridColumn['valueFormatter'],
        comparator: p.comparator as DataGridColumn['comparator'],
        tooltip: p.tooltip === '' ? true : (p.tooltip as DataGridColumn['tooltip']),
        editor:
            own.editor &&
            ((context: EditorContext) =>
                node(`editor:${def.key}:${context.index}`, () =>
                    own.editor!({
                        data: context.row,
                        field,
                        index: context.index,
                        column: p,
                        value: context.value,
                        error: context.error,
                        errorId: context.errorId,
                        setValue: context.setValue,
                        commit: context.commit,
                        cancel: context.cancel
                    })
                )),
        headerClass: normalizeClass(p.headerClass) || undefined,
        // A function works the class out by cell; anything else is Vue's own class value.
        bodyClass: typeof p.bodyClass === 'function' ? (p.bodyClass as DataGridColumn['bodyClass']) : normalizeClass(p.bodyClass) || undefined,
        headerStyle: normalizeStyle(p.headerStyle) as Record<string, string> | undefined,
        bodyStyle: typeof p.bodyStyle === 'function' ? (p.bodyStyle as DataGridColumn['bodyStyle']) : (normalizeStyle(p.bodyStyle) as Record<string, string> | undefined),
        body:
            own.body &&
            ((context: CellContext) =>
                node(`body:${context.key ?? def.key}:${context.pinned ?? ''}${context.index}`, () => own.body!({ data: context.row, field, index: context.index, column: p, pinned: context.pinned }))),
        headerContent: own.header && (() => node(`header:${def.key}`, () => own.header!({ column: p }))),
        filterOptionContent:
            own.filteroption &&
            ((context: { value: unknown; label: string }) => node(`filteroption:${def.key}:${String(context.value)}`, () => own.filteroption!({ value: context.value, label: context.label, column: p }))),
        // Drawn in two places at once — the popover and the dictionary — so each has its own node.
        descriptionContent: own.description && ((context: { place: string }) => node(`description:${def.key}:${context.place}`, () => own.description!({ column: p }))),
        footerContent: own.footer && (() => node(`footer:${def.key}`, () => own.footer!({ column: p }))),
        skeleton: own.skeleton && ((context: { index: number }) => node(`skeleton:${def.key}:${context.index}`, () => own.skeleton!({ column: p, index: context.index }))),
        filterContent:
            own.filter &&
            (() =>
                node(`filter:${def.key}`, () =>
                    own.filter!({ field: String(p.filterField ?? field ?? ''), filterModel: filters.value?.[String(p.filterField ?? field ?? '')], filterCallback })
                ))
    };
}

/**
 * The columns the slot declared, and the parts it wrote as children. Read
 * while this component renders — as an attribute that is never written — so
 * what the slot reads, a v-if or a bound header, is tracked like any other
 * dependency, and the table is told when it changes.
 */
const columns = shallowRef<DataGridColumn[]>([]);

function readSlot(): undefined {
    const found: ColumnDef[] = [];
    const written = new Map<string, Slots>();
    collect(slots.default?.(), found, written);
    columns.value = found.map(toTableColumn);
    parts.value = written;
    return undefined;
}

/** For a custom filter slot that changed `filterModel.value` on an object Vue does not track. */
const filterCallback = () => (filters.value = { ...(filters.value ?? {}) });

// ---- slots: each is rendered by Vue into a container of its own, which the table places

// Slot content keeps what it would inject where the table is (a theme scope, an overlay host).
const SlotHost = defineComponent({
    name: 'VtDataGridSlot',
    props: { draw: { type: Function, required: true } },
    setup(p) {
        const self = getCurrentInstance() as ComponentInternalInstance & { provides: object };
        self.provides = (instance as ComponentInternalInstance & { provides: object }).provides;
        return () => (p.draw as () => unknown)();
    }
});

const containers = new Map<string, HTMLElement>();
function node(key: string, draw: () => unknown): Node {
    let el = containers.get(key);
    if (!el) {
        el = document.createElement('div');
        el.style.display = 'contents';
        containers.set(key, el);
    }
    const vnode = h(SlotHost, { draw });
    vnode.appContext = instance.appContext;
    render(vnode, el);
    return el;
}

/** Containers whose cell the table no longer draws are torn down with it. */
function sweep() {
    for (const [key, el] of containers) {
        if (el.isConnected) continue;
        render(null, el);
        containers.delete(key);
    }
}

/** The slots the table draws, under the names the table knows them by. */
/** Each piece of content, by the slot that gives it and the part that stands for it. */
const CONTENT_SLOTS: { slot: string; part: string; key: string }[] = [
    { slot: 'header', part: 'Header', key: 'header' },
    { slot: 'footer', part: 'Footer', key: 'footer' },
    { slot: 'empty', part: 'Empty', key: 'empty' },
    { slot: 'loadingicon', part: 'LoadingIcon', key: 'loadingIcon' },
    { slot: 'paginatorstart', part: 'PaginatorStart', key: 'paginatorStart' },
    { slot: 'paginatorend', part: 'PaginatorEnd', key: 'paginatorEnd' }
];

const slotContent = (): DataGridConfig['content'] => ({
    ...Object.fromEntries(
        CONTENT_SLOTS.map((entry) => [entry.key, contentOf(slots as Slots, entry.slot, parts.value, entry.part)])
            .filter(([, draw]) => !!draw)
            .map(([key, draw]) => [key, (state: PageContext) => node(String(key), () => (draw as (data?: unknown) => unknown)(state))])
    ),
    // A row's detail, from the `expansion` slot, drawn under the row that opened it.
    ...(slots.expansion
        ? { rowExpansion: ({ row, index }: { row: unknown; index: number }) => node(`expansion:${index}:${String(props.dataKey ? (row as Record<string, unknown>)[props.dataKey] : index)}`, () => slots.expansion!({ data: row, index })) }
        : {}),
    // The page size is Vitral's own select here: the table draws a native one
    // for a page with no framework, and this is the framework.
    rowsPerPage: (state: RowsPerPageContext) =>
        node('rows-per-page', () =>
            h(Select, {
                modelValue: state.rows,
                options: state.options.map((rows) => ({ label: String(rows), value: rows })),
                optionLabel: 'label',
                optionValue: 'value',
                size: 'small',
                'aria-label': config.locale.rowsPerPage,
                class: 'vt-paginator-rows-per-page',
                'onUpdate:modelValue': (value: unknown) => state.setRows(Number(value))
            })
        )
});

// ---- pass-through: the root takes class, style and design tokens; the table its naming attributes

function resolve(value: PassThroughValue | undefined, context: PassThroughContext): PassThroughAttrs {
    const resolved = typeof value === 'function' ? value(context) : value;
    if (resolved === undefined) return {};
    return typeof resolved === 'string' ? { class: resolved } : resolved;
}

const vueAttrs = (value: PassThroughAttrs) => ({ ...value, class: normalizeClass(value.class) || undefined, style: normalizeStyle(value.style) });

// Naming attributes belong to the <table>; everything else dresses the wrapper.
const TABLE_ATTRS = ['aria-label', 'aria-labelledby', 'aria-describedby'];

function passThrough(part: string, context: DomPassThroughContext): PassThroughAttrs | undefined {
    const ctx: PassThroughContext = { props: props as Record<string, unknown>, state: context.state, part };
    const global = config.pt.datagrid?.[part];
    const local = props.pt?.[part];
    let own: PassThroughAttrs | undefined;
    if (part === 'root') {
        own = Object.fromEntries(Object.entries(attrs).filter(([key]) => !TABLE_ATTRS.includes(key)));
        if (props.dt) own = mergeAttrs(vueAttrs(own), { style: flattenTokens(props.dt as TokenTree, [], theme?.options.prefix) });
    } else if (part === 'table') {
        own = Object.fromEntries(Object.entries(attrs).filter(([key]) => TABLE_ATTRS.includes(key)));
    }
    if (!own && !global && !local) return undefined;
    return mergeAttrs(vueAttrs(own ?? {}), vueAttrs(resolve(global, ctx)), vueAttrs(resolve(local, ctx)));
}

function passThroughMap(): PassThrough {
    const parts = new Set(['root', 'table', ...Object.keys(config.pt.datagrid ?? {}), ...Object.keys(props.pt ?? {})]);
    return Object.fromEntries([...parts].map((part) => [part, (context: DomPassThroughContext) => passThrough(part, context)]));
}

// ---- the table ------------------------------------------------------------------

const models = (): Partial<DataGridModels> => ({
    first: first.value,
    rows: rows.value,
    sortField: sortField.value,
    sortOrder: (sortOrder.value as 1 | -1 | null) ?? null,
    multiSortMeta: (multiSortMeta.value as DataGridModels['multiSortMeta']) ?? [],
    filters: (filters.value ?? {}) as DataGridModels['filters'],
    selection: selection.value,
    columnLayout: (columnLayout.value ?? {}) as DataGridModels['columnLayout'],
    collapsedGroups: collapsedGroups.value ?? [],
    expandedRows: expandedRows.value ?? [],
    expandedTree: expandedTree.value ?? []
});

const inputs = (): DataGridConfig => ({
    groupBy: props.groupBy,
    aggregates: props.aggregates as DataGridConfig['aggregates'],
    totalRow: props.totalRow,
    groupLabel: props.groupLabel,
    treeData: props.treeData,
    // The `#status` slot draws the bar too, unless `status-bar` is turned off outright.
    statusBar:
        slots.status && props.statusBar !== false
            ? (context: Parameters<NonNullable<DataGridSlots['status']>>[0]) => node(`status:${context.filtered}:${context.selected}:${context.range?.count ?? 0}`, () => slots.status!(context))
            : props.statusBar,
    value: toRaw(props.value),
    columns: columns.value,
    dataKey: props.dataKey,
    dataSource: props.dataSource as DataGridConfig['dataSource'],
    lazy: props.lazy,
    totalRecords: props.totalRecords,
    loading: props.loading,
    loadingMode: props.loadingMode,
    skeletonRows: props.skeletonRows,
    paginator: props.paginator,
    rowsPerPageOptions: props.rowsPerPageOptions,
    pageLinkSize: props.pageLinkSize,
    paginatorTemplate: props.paginatorTemplate as DataGridConfig['paginatorTemplate'],
    currentPageReportTemplate: props.currentPageReportTemplate,
    paginatorPosition: props.paginatorPosition,
    alwaysShowPaginator: props.alwaysShowPaginator,
    sortMode: props.sortMode,
    removableSort: props.removableSort,
    globalFilterFields: props.globalFilterFields,
    filterDisplay: props.filterDisplay,
    columnMenu: props.columnMenu,
    contextMenu: props.contextMenu,
    filterDelay: props.filterDelay,
    selectionMode: props.selectionMode,
    navigation: props.navigation,
    editMode: props.editMode,
    editOnClick: props.editOnClick,
    undoRedo: props.undoRedo,
    cellSelection: props.cellSelection,
    fillHandle: props.fillHandle,
    clipboard: props.clipboard,
    flashCells: props.flashCells,
    pivot: props.pivot as DataGridConfig['pivot'],
    sideBar: props.sideBar,
    sideBarOpen: props.sideBarOpen,
    columnInfo: props.columnInfo,
    toolbar: props.toolbar as DataGridConfig['toolbar'],
    exportRows: props.exportRows as DataGridConfig['exportRows'],
    columnsDrawer: props.columnsDrawer,
    dictionaryDrawer: props.dictionaryDrawer,
    stateKey: props.stateKey,
    headerTools: props.headerTools,
    headerToolsAt: props.headerToolsAt,
    headerInfoAt: props.headerInfoAt,
    minHeight: props.minHeight,
    fillRows: props.fillRows,
    responsiveLayout: props.responsiveLayout,
    breakpoint: props.breakpoint,
    dictionary: props.dictionary as DataGridConfig['dictionary'],
    columnDefaults: props.columnDefaults as DataGridConfig['columnDefaults'],
    externalFilter: props.externalFilter as DataGridConfig['externalFilter'],
    rowNumbers: props.rowNumbers as DataGridConfig['rowNumbers'],
    dictionaryModule: props.dictionaryModule,
    dictionarySubtitle: props.dictionarySubtitle,
    virtualScroll: props.virtualScroll,
    virtualColumns: props.virtualColumns,
    overscan: props.overscan,
    rowHeight: props.rowHeight,
    pinnedTopRows: props.pinnedTopRows,
    pinnedBottomRows: props.pinnedBottomRows,
    resizableColumns: props.resizableColumns,
    columnResizeMode: props.columnResizeMode,
    reorderableColumns: props.reorderableColumns,
    columnToggle: props.columnToggle,
    group: props.group,
    stripedRows: props.stripedRows,
    showGridlines: props.showGridlines,
    size: props.size,
    scrollable: props.scrollable,
    scrollHeight: props.scrollHeight,
    scrollbar: props.scrollbar ?? config.scrollbar,
    scrollbarArrows: config.scrollbarArrows,
    emptyMessage: props.emptyMessage,
    rowClass: (row: unknown) => normalizeClass(props.rowClass?.(row)) || undefined,
    tableStyle: props.tableStyle,
    caption: props.caption,
    showCaption: props.showCaption,
    locale: config.locale,
    unstyled: unstyled(),
    pt: passThroughMap(),
    content: slotContent(),
    ...models()
});

/** The filters as the table last knew them, as text: see the watch on `filters`. */
const filtersText = (value: unknown) => JSON.stringify(value ?? {});
let knownFilters = filtersText(filters.value);

/** What the reader changed, put back where the application bound it. */
let writing = false;
function published(state: DataGridModels) {
    writing = true;
    knownFilters = filtersText(state.filters);
    first.value = state.first;
    rows.value = state.rows;
    if (props.sortMode === 'multiple') multiSortMeta.value = state.multiSortMeta;
    else {
        sortField.value = state.sortField;
        sortOrder.value = state.sortOrder;
    }
    filters.value = state.filters as DataGridFilterMeta;
    selection.value = state.selection;
    columnLayout.value = state.columnLayout as ColumnLayoutLike;
    collapsedGroups.value = state.collapsedGroups;
    expandedRows.value = state.expandedRows;
    expandedTree.value = state.expandedTree;
    writing = false;
}

const events: DataGridConfig['on'] = {
    change: published,
    page: (event) => emit('page', event),
    sort: (event) => emit('sort', event as DataGridSortEvent),
    filter: (event) => emit('filter', event as DataGridFilterEvent),
    'lazy-load': (event) => emit('lazy-load', event),
    'row-click': (event) => emit('row-click', event),
    'row-select': (event) => emit('row-select', event),
    'row-unselect': (event) => emit('row-unselect', event),
    'row-select-all': (event) => emit('row-select-all', event),
    'row-unselect-all': (event) => emit('row-unselect-all', event),
    'column-resize': (event) => emit('column-resize', event),
    'column-reorder': (event) => emit('column-reorder', event),
    'column-toggle': (event) => emit('column-toggle', event),
    'column-pin': (event) => emit('column-pin', event),
    'row-reorder': (event) => emit('row-reorder', event),
    'range-change': (event) => emit('range-change', event),
    'cells-change': (event) => emit('cells-change', event),
    'tree-toggle': (event) => emit('tree-toggle', event),
    'size-change': (event) => emit('update:size', event.size),
    'group-by-change': (event) => emit('update:groupBy', event.groupBy),
    'aggregates-change': (event) => emit('update:aggregates', event.aggregates),
    'side-panel-change': (event) => emit('update:sideBarOpen', event.panel),
    'pivot-change': (event) => {
        emit('update:pivot', event.pivot as DataGridPivot);
        emit('pivot-change', event as { pivot: DataGridPivot });
    },
    'cell-edit-start': (event) => emit('cell-edit-start', event),
    'cell-edit-complete': (event) => emit('cell-edit-complete', event),
    'cell-edit-cancel': (event) => emit('cell-edit-cancel', event),
    'cell-edit-undo': (event) => emit('cell-edit-undo', event),
    'row-edit-save': (event) => emit('row-edit-save', event),
    'row-edit-cancel': (event) => emit('row-edit-cancel', event)
};

onMounted(() => {
    table = createDataGrid(host.value!, {
        ...inputs(),
        id,
        nonce: config.csp.nonce,
        cssLayer: config.cssLayer,
        overlayTarget: () => overlayTarget.value,
        zIndex: config.zIndex.overlay,
        on: events
    });
    sweep();
});

/** Everything the table is told, whenever any of it changes. */
function push(next: Partial<DataGridConfig>) {
    if (!table) return;
    table.update(next);
    sweep();
}

// Deep, over the reactive props (not their raw objects), so a change made in place is seen too.
watch(
    () => [props.value, columns.value, props.dataSource, props.lazy, props.totalRecords, props.loading, props.loadingMode, props.skeletonRows, props.group, props.pinnedTopRows, props.pinnedBottomRows],
    () => push(inputs()),
    { deep: true }
);
watch(
    () => [
        props.paginator,
        props.rowsPerPageOptions,
        props.pageLinkSize,
        props.paginatorTemplate,
        props.currentPageReportTemplate,
        props.paginatorPosition,
        props.alwaysShowPaginator,
        props.sortMode,
        props.removableSort,
        props.globalFilterFields,
        props.filterDisplay,
        props.treeData,
        props.statusBar,
        props.columnMenu,
        props.contextMenu,
        props.filterDelay,
        props.selectionMode,
        props.navigation,
        props.editMode,
        props.editOnClick,
        props.undoRedo,
        props.cellSelection,
        props.fillHandle,
        props.clipboard,
        props.flashCells,
        props.pivot,
        props.groupBy,
        props.aggregates,
        props.totalRow,
        props.sideBar,
        props.columnInfo,
        props.toolbar,
        props.exportRows,
        props.columnsDrawer,
        props.dictionaryDrawer,
        props.headerTools,
        props.headerToolsAt,
        props.headerInfoAt,
        props.minHeight,
        props.fillRows,
        props.responsiveLayout,
        props.breakpoint,
        props.dictionary,
        props.dictionaryModule,
        props.dictionarySubtitle,
        props.virtualScroll,
        props.virtualColumns,
        props.overscan,
        props.rowHeight,
        props.resizableColumns,
        props.columnResizeMode,
        props.reorderableColumns,
        props.columnToggle,
        props.stripedRows,
        props.showGridlines,
        props.size,
        props.scrollable,
        props.scrollHeight,
        props.scrollbar,
        config.scrollbar,
        config.scrollbarArrows,
        props.emptyMessage,
        props.tableStyle,
        props.caption,
        props.showCaption
    ],
    () => push(inputs())
);

// The models: what the application changed, which is not what the table just published.
watch(
    () => [first.value, rows.value, sortField.value, sortOrder.value, multiSortMeta.value, selection.value, columnLayout.value, collapsedGroups.value, expandedRows.value, expandedTree.value],
    () => {
        if (writing || !table) return;
        const state = table.state();
        const next: Partial<DataGridModels> = {};
        if (first.value !== state.first) next.first = first.value;
        if (rows.value !== state.rows) next.rows = rows.value;
        if (sortField.value !== state.sortField) next.sortField = sortField.value;
        if ((sortOrder.value ?? null) !== state.sortOrder) next.sortOrder = (sortOrder.value as 1 | -1 | null) ?? null;
        if (multiSortMeta.value && multiSortMeta.value !== state.multiSortMeta) next.multiSortMeta = multiSortMeta.value as DataGridModels['multiSortMeta'];
        if (selection.value !== state.selection) next.selection = selection.value;
        if (columnLayout.value && columnLayout.value !== state.columnLayout) next.columnLayout = columnLayout.value as DataGridModels['columnLayout'];
        if (collapsedGroups.value && collapsedGroups.value !== state.collapsedGroups) next.collapsedGroups = collapsedGroups.value;
        if (expandedRows.value && expandedRows.value !== state.expandedRows) next.expandedRows = expandedRows.value;
        if (expandedTree.value && expandedTree.value !== state.expandedTree) next.expandedTree = expandedTree.value;
        if (Object.keys(next).length) push(next);
    },
    { deep: true }
);

// The filters on their own, and deep: a search box bound to `filters.global.value`
// changes the object the table already holds, which no comparison by identity
// sees. So they are compared as text with what the table last knew of them.
watch(
    filters,
    (value) => {
        if (!table || filtersText(value) === knownFilters) return;
        knownFilters = filtersText(value);
        push({ filters: { ...(value ?? {}) } as DataGridModels['filters'] });
    },
    { deep: true }
);

// The panel the page asks for, after the first: the reader's own tabs report back through `update:sideBarOpen`.
watch(
    () => props.sideBarOpen,
    (panel) => table?.openSidePanel(panel ?? null)
);

watch(
    () => [config.locale, unstyled(), props.pt, props.dt, config.pt.datagrid, config.zIndex.overlay] as const,
    () => push({ locale: config.locale, unstyled: unstyled(), pt: passThroughMap(), zIndex: config.zIndex.overlay }),
    { deep: true }
);

// A slot added or removed, and the attributes the wrapper wears, are read through
// functions: draw again when the component that holds them has re-rendered.
onUpdated(() => {
    if (!table) return;
    table.update({ pt: passThroughMap(), content: slotContent() });
    sweep();
});

// The theme's own scope can change what the table measures.
const stopTheme = theme?.subscribe(() => table?.refresh());

onBeforeUnmount(() => {
    stopTheme?.();
    table?.destroy();
    table = null;
    containers.forEach((el) => render(null, el));
    containers.clear();
});

defineExpose({
    reload: () => table?.reload(),
    /** Scrolls a row into view by its place among the rows on show; in a virtual grid, draws it. */
    scrollToIndex: (index: number) => table?.scrollToIndex(index),
    /** Opens a cell's editor, by the row's place among the rows on show and the column's key. */
    startEdit: (index: number, key: string) => table?.startEdit(index, key),
    /** Closes the editors, keeping what was typed (if it passes) or, with `cancel`, dropping it. */
    stopEdit: (cancel?: boolean) => table?.stopEdit(cancel) ?? true,
    /** Puts the keyboard on a cell. */
    focusCell: (index: number, key: string) => table?.focusCell(index, key),
    /** Marks the block of cells from one to another: `{ index, key }`, the index among the rows on show. */
    selectRange: (anchor: { index: number; key: string }, focus?: { index: number; key: string }) => table?.selectRange(anchor, focus),
    clearRange: () => table?.clearRange(),
    /** The block marked, its rows by index among every row, and the values in it. */
    getRange: () => table?.getRange() ?? null,
    /** The rows as the bytes of an Excel workbook, numbers, dates and booleans kept as such. */
    toXlsx: (options?: Parameters<DataGridHandle['toXlsx']>[0]) => table?.toXlsx(options) ?? new Uint8Array(),
    /** Downloads the rows as an Excel workbook. */
    exportExcel: (options?: Parameters<DataGridHandle['exportExcel']>[0]) => table?.exportExcel(options),
    /** Opens a panel of the side bar — the data dictionary from a button of the page's own — or, given null, shuts it. */
    openSidePanel: (panel: Parameters<DataGridHandle['openSidePanel']>[0]) => table?.openSidePanel(panel),
    openColumnsDrawer: (tab?: Parameters<DataGridHandle['openColumnsDrawer']>[0]) => table?.openColumnsDrawer(tab),
    /** Opens every group, or every row of a tree that holds rows. */
    expandAll: () => table?.expandAll(),
    /** Shuts every group, or every row of a tree. */
    collapseAll: () => table?.collapseAll(),
    undo: () => table?.undo(),
    redo: () => table?.redo(),
    /** The table as CSV; see `@vitral/datagrid`'s `toCSV`. */
    toCSV: (options?: Parameters<DataGridHandle['toCSV']>[0]) => table?.toCSV(options) ?? '',
    /** Hands the reader the table as a CSV file. */
    exportCSV: (options?: Parameters<DataGridHandle['exportCSV']>[0]) => table?.exportCSV(options),
    /** The framework-free table underneath, for anything this component does not expose. */
    table: () => table
});
</script>

<template>
    <div ref="host" :data-vt-parts="readSlot()" />
</template>
