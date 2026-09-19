<script setup lang="ts">
import { createDataTable, type CellContext, type PageContext, type RowsPerPageContext, type TableColumn, type TableConfig, type TableHandle, type TableModels } from '@vitral/datatable';
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
import type { ColumnLayoutLike, DataTableEmits, DataTableFilterEvent, DataTableFilterMeta, DataTableProps, DataTableSlots, DataTableSortEvent, SortMetaLike } from './types';

// The table is `@vitral/datatable`'s framework-free renderer; this component
// only hands it the props, the columns the `<Column>`s declared, the Vitral
// configuration (locale, unstyled, pass-through, the overlay host, the theme)
// and the slots, and turns its events into emits. The element it renders
// becomes the table's root, so what is drawn — a real <table>, its headers,
// its controls and their keyboard — is the addon's, and the same table can be
// drawn by React, by Angular or by a page with no framework at all.

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

const { config, theme } = useVitral();
const overlayTarget = useOverlayTarget();
const attrs = useAttrs();
const id = useId();
const instance = getCurrentInstance()!;
const host = shallowRef<HTMLElement | null>(null);
let table: TableHandle | null = null;

const unstyled = () => props.unstyled ?? config.unstyled;

// ---- columns, read from the <Column> vnodes -------------------------------------

type ColumnSlotFn = (props: Record<string, unknown>) => VNode[];

interface ColumnDef {
    key: string;
    props: Record<string, unknown>;
    slots: Partial<Record<'body' | 'header' | 'footer' | 'filter', ColumnSlotFn>>;
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

/** The parts the template wrote as children, by name, from the last read. */
const parts = shallowRef<Map<string, Slots>>(new Map());

function collect(nodes: unknown, out: ColumnDef[], found: Map<string, Slots>) {
    collectParts(nodes, found, (vnode) => {
        if (isColumn(vnode)) out.push(toColumn(vnode, out.length));
    });
}

/** What one `<Column>` declared, as the table reads a column. */
function toTableColumn(def: ColumnDef): TableColumn {
    const p = def.props;
    const field = p.field as string | undefined;
    const own = def.slots;
    return {
        key: def.key,
        field,
        header: p.header as string | undefined,
        footer: p.footer as string | undefined,
        sortable: truthy(p.sortable),
        sortField: p.sortField as string | undefined,
        filterField: p.filterField as string | undefined,
        filterPlaceholder: p.filterPlaceholder as string | undefined,
        filterMatchMode: p.filterMatchMode as string | undefined,
        selectionMode: p.selectionMode as 'single' | 'multiple' | undefined,
        align: p.align as 'left' | 'center' | 'right' | undefined,
        hidden: truthy(p.hidden),
        resizable: maybe(p.resizable),
        minWidth: size(p.minWidth),
        width: size(p.width),
        pinned: p.pinned as 'left' | 'right' | undefined,
        toggleable: p.toggleable === undefined ? !p.selectionMode : truthy(p.toggleable),
        headerClass: normalizeClass(p.headerClass) || undefined,
        bodyClass: normalizeClass(p.bodyClass) || undefined,
        headerStyle: normalizeStyle(p.headerStyle) as Record<string, string> | undefined,
        bodyStyle: normalizeStyle(p.bodyStyle) as Record<string, string> | undefined,
        body: own.body && ((context: CellContext) => node(`body:${def.key}:${context.index}`, () => own.body!({ data: context.row, field, index: context.index, column: p }))),
        headerContent: own.header && (() => node(`header:${def.key}`, () => own.header!({ column: p }))),
        footerContent: own.footer && (() => node(`footer:${def.key}`, () => own.footer!({ column: p }))),
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
const columns = shallowRef<TableColumn[]>([]);

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
    name: 'VtDataTableSlot',
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

const slotContent = (): TableConfig['content'] => ({
    ...Object.fromEntries(
        CONTENT_SLOTS.map((entry) => [entry.key, contentOf(slots as Slots, entry.slot, parts.value, entry.part)])
            .filter(([, draw]) => !!draw)
            .map(([key, draw]) => [key, (state: PageContext) => node(String(key), () => (draw as (data?: unknown) => unknown)(state))])
    ),
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
    const global = config.pt.datatable?.[part];
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
    const parts = new Set(['root', 'table', ...Object.keys(config.pt.datatable ?? {}), ...Object.keys(props.pt ?? {})]);
    return Object.fromEntries([...parts].map((part) => [part, (context: DomPassThroughContext) => passThrough(part, context)]));
}

// ---- the table ------------------------------------------------------------------

const models = (): Partial<TableModels> => ({
    first: first.value,
    rows: rows.value,
    sortField: sortField.value,
    sortOrder: (sortOrder.value as 1 | -1 | null) ?? null,
    multiSortMeta: (multiSortMeta.value as TableModels['multiSortMeta']) ?? [],
    filters: (filters.value ?? {}) as TableModels['filters'],
    selection: selection.value,
    columnLayout: (columnLayout.value ?? {}) as TableModels['columnLayout']
});

const inputs = (): TableConfig => ({
    value: toRaw(props.value),
    columns: columns.value,
    dataKey: props.dataKey,
    dataSource: props.dataSource as TableConfig['dataSource'],
    lazy: props.lazy,
    totalRecords: props.totalRecords,
    loading: props.loading,
    paginator: props.paginator,
    rowsPerPageOptions: props.rowsPerPageOptions,
    pageLinkSize: props.pageLinkSize,
    paginatorTemplate: props.paginatorTemplate as TableConfig['paginatorTemplate'],
    currentPageReportTemplate: props.currentPageReportTemplate,
    paginatorPosition: props.paginatorPosition,
    alwaysShowPaginator: props.alwaysShowPaginator,
    sortMode: props.sortMode,
    removableSort: props.removableSort,
    globalFilterFields: props.globalFilterFields,
    filterDisplay: props.filterDisplay,
    filterDelay: props.filterDelay,
    selectionMode: props.selectionMode,
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

/** What the reader changed, put back where the application bound it. */
let writing = false;
function published(state: TableModels) {
    writing = true;
    first.value = state.first;
    rows.value = state.rows;
    if (props.sortMode === 'multiple') multiSortMeta.value = state.multiSortMeta;
    else {
        sortField.value = state.sortField;
        sortOrder.value = state.sortOrder;
    }
    filters.value = state.filters as DataTableFilterMeta;
    selection.value = state.selection;
    columnLayout.value = state.columnLayout as ColumnLayoutLike;
    writing = false;
}

const events: TableConfig['on'] = {
    change: published,
    page: (event) => emit('page', event),
    sort: (event) => emit('sort', event as DataTableSortEvent),
    filter: (event) => emit('filter', event as DataTableFilterEvent),
    'lazy-load': (event) => emit('lazy-load', event),
    'row-click': (event) => emit('row-click', event),
    'row-select': (event) => emit('row-select', event),
    'row-unselect': (event) => emit('row-unselect', event),
    'row-select-all': (event) => emit('row-select-all', event),
    'row-unselect-all': (event) => emit('row-unselect-all', event),
    'column-resize': (event) => emit('column-resize', event),
    'column-reorder': (event) => emit('column-reorder', event),
    'column-toggle': (event) => emit('column-toggle', event),
    'column-pin': (event) => emit('column-pin', event)
};

onMounted(() => {
    table = createDataTable(host.value!, {
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
function push(next: Partial<TableConfig>) {
    if (!table) return;
    table.update(next);
    sweep();
}

// Deep, over the reactive props (not their raw objects), so a change made in place is seen too.
watch(
    () => [props.value, columns.value, props.dataSource, props.lazy, props.totalRecords, props.loading, props.group],
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
        props.filterDelay,
        props.selectionMode,
        props.resizableColumns,
        props.columnResizeMode,
        props.reorderableColumns,
        props.columnToggle,
        props.stripedRows,
        props.showGridlines,
        props.size,
        props.scrollable,
        props.scrollHeight,
        props.emptyMessage,
        props.tableStyle,
        props.caption,
        props.showCaption
    ],
    () => push(inputs())
);

// The models: what the application changed, which is not what the table just published.
watch(
    () => [first.value, rows.value, sortField.value, sortOrder.value, multiSortMeta.value, filters.value, selection.value, columnLayout.value],
    () => {
        if (writing || !table) return;
        const state = table.state();
        const next: Partial<TableModels> = {};
        if (first.value !== state.first) next.first = first.value;
        if (rows.value !== state.rows) next.rows = rows.value;
        if (sortField.value !== state.sortField) next.sortField = sortField.value;
        if ((sortOrder.value ?? null) !== state.sortOrder) next.sortOrder = (sortOrder.value as 1 | -1 | null) ?? null;
        if (multiSortMeta.value && multiSortMeta.value !== state.multiSortMeta) next.multiSortMeta = multiSortMeta.value as TableModels['multiSortMeta'];
        if (filters.value !== state.filters) next.filters = (filters.value ?? {}) as TableModels['filters'];
        if (selection.value !== state.selection) next.selection = selection.value;
        if (columnLayout.value && columnLayout.value !== state.columnLayout) next.columnLayout = columnLayout.value as TableModels['columnLayout'];
        if (Object.keys(next).length) push(next);
    },
    { deep: true }
);

watch(
    () => [config.locale, unstyled(), props.pt, props.dt, config.pt.datatable, config.zIndex.overlay] as const,
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
    /** The framework-free table underneath, for anything this component does not expose. */
    table: () => table
});
</script>

<template>
    <div ref="host" :data-vt-parts="readSlot()" />
</template>
