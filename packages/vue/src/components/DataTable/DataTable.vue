<script setup lang="ts">
import { getField, sortData, sortOrderOf, toggleSort, type SortMeta, type SortOrder } from '@vitral/core';
import { datatableStyle } from '@vitral/styles';
import { camelize, computed, Fragment, mergeProps, useAttrs, type FunctionalComponent, type VNode } from 'vue';
import { collectParts, contentOf } from '../../base/parts';
import { useComponent } from '../../base/useComponent';
import Icon from '../Icon/Icon.vue';
import Column from './Column.vue';
import type { DataTableEmits, DataTableProps, DataTableSlots } from './types';

// A real <table>: one <th scope="col"> a column, a button in the head of a
// sortable one and `aria-sort` on the header it belongs to, so a screen reader
// reads it as the table it is and says how it is sorted.
//
// This is the small one on purpose. It takes rows that are already in hand and
// shows them: sort, stripes, gridlines, a head that can stick. Paging,
// filtering, selection, editing, and columns the reader resizes, reorders or
// freezes are `@vitral/datagrid`'s — a table that needs them should be a
// <DataGrid>, not this with props bolted on.

defineOptions({ name: 'VtDataTable', inheritAttrs: false });

const props = withDefaults(defineProps<DataTableProps>(), { unstyled: undefined, value: () => [] });
const sortField = defineModel<string | null>('sortField', { default: null });
const sortOrder = defineModel<SortOrder | null>('sortOrder', { default: null });
const emit = defineEmits<DataTableEmits>();
const slots = defineSlots<DataTableSlots>();

const { part, locale } = useComponent(datatableStyle, props);

// The accessible name belongs on the <table>, not on the wrapper around it.
const attrs = useAttrs();
const TABLE_ATTRS = ['aria-label', 'aria-labelledby', 'aria-describedby'];
const rootAttrs = computed(() => Object.fromEntries(Object.entries(attrs).filter(([k]) => !TABLE_ATTRS.includes(k))));
const tableAttrs = computed(() => Object.fromEntries(Object.entries(attrs).filter(([k]) => TABLE_ATTRS.includes(k))));

// ---- columns ---------------------------------------------------------------------

type SlotFn = (props: Record<string, unknown>) => VNode[];
interface ColumnDef {
    key: string;
    field?: string;
    header?: string;
    sortable: boolean;
    align?: string;
    style?: unknown;
    class?: unknown;
    props: Record<string, unknown>;
    slots: Partial<Record<'body' | 'header', SlotFn>>;
}

const truthy = (v: unknown) => v === '' || v === true || v === 'true';
const isColumn = (vnode: VNode) => vnode.type === Column || (vnode.type as { name?: string } | null)?.name === 'VtDataTableColumn';

function collect(nodes: unknown, out: ColumnDef[]) {
    if (!Array.isArray(nodes)) return;
    for (const node of nodes) {
        if (Array.isArray(node)) collect(node, out);
        else if (node && typeof node === 'object') {
            const vnode = node as VNode;
            if (vnode.type === Fragment) collect(vnode.children, out);
            else if (isColumn(vnode)) {
                const p: Record<string, unknown> = {};
                for (const [k, v] of Object.entries(vnode.props ?? {})) p[camelize(k)] = v;
                if (truthy(p.hidden)) continue;
                const children = vnode.children;
                out.push({
                    key: String(p.columnKey ?? p.field ?? `column-${out.length}`),
                    field: p.field as string | undefined,
                    header: p.header as string | undefined,
                    sortable: truthy(p.sortable),
                    align: p.align as string | undefined,
                    style: p.style,
                    class: p.class,
                    props: p,
                    slots: (children && typeof children === 'object' && !Array.isArray(children) ? children : {}) as ColumnDef['slots']
                });
            }
        }
    }
}

// One pass over the default slot takes both the columns and the parts written
// as children, the way DataGrid does it.
const parsed = computed(() => {
    const columns: ColumnDef[] = [];
    const parts = new Map<string, ReturnType<typeof Object>>();
    collectParts(slots.default?.(), parts as never, (vnode) => collect([vnode], columns));
    return { columns, parts: parts as never };
});
const columns = computed(() => parsed.value.columns);
const headerContent = computed(() => contentOf(slots as never, 'header', parsed.value.parts, 'Header'));
const footerContent = computed(() => contentOf(slots as never, 'footer', parsed.value.parts, 'Footer'));
const emptyContent = computed(() => contentOf(slots as never, 'empty', parsed.value.parts, 'Empty'));

const VNodes: FunctionalComponent<{ vnodes: unknown }> = (p) => p.vnodes as VNode[];
const display = (value: unknown) => (value === null || value === undefined ? '' : String(value));

// ---- rows ------------------------------------------------------------------------

const sortMeta = computed<SortMeta[]>(() => (sortField.value && sortOrder.value ? [{ field: sortField.value, order: sortOrder.value }] : []));
const rows = computed(() => (sortMeta.value.length ? sortData(props.value as unknown[], sortMeta.value, locale.value.code) : [...(props.value as unknown[])]));

const sortedBy = (column: ColumnDef) => (column.field ? sortOrderOf(sortMeta.value, column.field) || null : null);

function onSort(column: ColumnDef) {
    if (!column.field) return;
    // Ascending, then descending, then back to the order the rows arrived in:
    // a reader who sorted by mistake can put the table back.
    const next = toggleSort(sortMeta.value, column.field, { removable: true });
    sortField.value = next[0]?.field ?? null;
    sortOrder.value = next[0]?.order ?? null;
    emit('sort', { sortField: sortField.value, sortOrder: sortOrder.value, multiSortMeta: next });
}

const rowKey = (row: unknown, index: number) => (props.dataKey ? String(getField(row, props.dataKey) ?? index) : index);
const ariaSort = (column: ColumnDef) => (!column.sortable ? undefined : sortedBy(column) === 1 ? 'ascending' : sortedBy(column) === -1 ? 'descending' : 'none');

const rootState = computed(() => ({ striped: props.stripedRows, gridlines: props.showGridlines, size: props.size, scrollable: !!props.scrollHeight }));
</script>

<template>
    <div v-bind="mergeProps(rootAttrs, part('root', rootState))">
        <div v-if="headerContent" v-bind="part('header')"><VNodes :vnodes="headerContent()" /></div>
        <div v-bind="part('tableContainer')" :style="scrollHeight ? { maxHeight: scrollHeight } : undefined">
            <table v-bind="mergeProps(tableAttrs, part('table'))">
                <caption v-if="caption" v-bind="part('caption')">{{ caption }}</caption>
                <colgroup v-if="columns.some((c) => c.style || c.class)">
                    <col v-for="col in columns" :key="col.key" :style="col.style as never" :class="col.class as never" />
                </colgroup>
                <thead v-bind="part('thead')">
                    <tr v-bind="part('headerRow')">
                        <th v-for="col in columns" :key="col.key" scope="col" v-bind="part('headerCell', { align: col.align, sorted: !!sortedBy(col) })" :aria-sort="ariaSort(col)">
                            <button v-if="col.sortable && col.field" type="button" v-bind="part('sortButton')" @click="onSort(col)">
                                <VNodes v-if="col.slots.header" :vnodes="col.slots.header({ column: col.props })" />
                                <template v-else>{{ col.header ?? col.field }}</template>
                                <Icon :icon="!sortedBy(col) ? 'sort' : sortedBy(col) === 1 ? 'arrowUp' : 'arrowDown'" v-bind="part('sortIcon', { active: !!sortedBy(col) })" />
                            </button>
                            <template v-else>
                                <VNodes v-if="col.slots.header" :vnodes="col.slots.header({ column: col.props })" />
                                <template v-else>{{ col.header ?? col.field }}</template>
                            </template>
                        </th>
                    </tr>
                </thead>
                <tbody v-bind="part('tbody')">
                    <template v-if="rows.length">
                        <tr
                            v-for="(row, index) in rows"
                            :key="rowKey(row, index)"
                            v-bind="part('row', { hoverable: rowHover })"
                            @click="emit('rowClick', { originalEvent: $event, data: row, index })"
                        >
                            <td v-for="col in columns" :key="col.key" v-bind="part('bodyCell', { align: col.align })">
                                <VNodes v-if="col.slots.body" :vnodes="col.slots.body({ data: row, index, field: col.field, column: col.props })" />
                                <template v-else>{{ display(getField(row, col.field)) }}</template>
                            </td>
                        </tr>
                    </template>
                    <tr v-else>
                        <td :colspan="columns.length || 1" v-bind="part('emptyCell')">
                            <VNodes v-if="emptyContent" :vnodes="emptyContent()" />
                            <template v-else>{{ emptyMessage ?? locale.emptyMessage }}</template>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div v-if="footerContent" v-bind="part('footer')"><VNodes :vnodes="footerContent()" /></div>
    </div>
</template>
