<script setup lang="ts">
import {
    filterTree,
    flattenTree,
    getField,
    isLeaf,
    setChecked,
    sortTree,
    toggleSort,
    treeKeyAction,
    type CheckState,
    type FlatNode,
    type TreeNode
} from '@vitral/core';
import { aggregateOf } from '@vitral/datagrid';
import { treetableStyle } from '@vitral/styles';
import { camelize, computed, Fragment, mergeProps, nextTick, ref, useAttrs, useId, watch, type FunctionalComponent, type VNode } from 'vue';
import { useComponent } from '../../base/useComponent';
import { useScrollbars } from '../../base/useScrollbars';
import Column from '../DataGrid/Column.vue';
import Icon from '../Icon/Icon.vue';
import Paginator from '../Paginator/Paginator.vue';
import type { TreeExpandedKeys, TreeNodeLike, TreeSelectionKeys } from '../Tree/types';
import type { TreeTableEmits, TreeTableProps, TreeTableSlots } from './types';

// The WAI-ARIA treegrid, focused by row: a real <table role="treegrid"> whose
// rows carry their level, position and expansion. One row is in the tab
// order; Up and Down move, Right opens a row or enters it, Left closes it or
// goes to the parent, Home and End jump (core's treeKeyAction), Enter and
// Space select, or, without selection, Enter toggles. Sorting keeps the
// nesting (core's sortTree); a global filter keeps the branches that lead to
// matches, opened. Columns are DataGrid's <Column>; one with `aggregate`
// shows on a row with rows under it the total of the rows its branches end in.

defineOptions({ name: 'VtTreeTable', inheritAttrs: false });

const props = withDefaults(defineProps<TreeTableProps>(), { unstyled: undefined, value: () => [], rows: 10 });
const expandedKeys = defineModel<TreeExpandedKeys>('expandedKeys', { default: () => ({}) });
const selectionKeys = defineModel<TreeSelectionKeys>('selectionKeys', { default: () => ({}) });
const sortField = defineModel<string | null>('sortField', { default: null });
const sortOrder = defineModel<1 | -1 | null>('sortOrder', { default: null });
const first = defineModel<number>('first', { default: 0 });
const emit = defineEmits<TreeTableEmits>();
const slots = defineSlots<TreeTableSlots>();

const { part, locale } = useComponent(treetableStyle, props);
const containerRef = ref<HTMLElement | null>(null);
useScrollbars(containerRef, props);
const id = useId();
const attrs = useAttrs();
const TABLE_ATTRS = ['aria-label', 'aria-labelledby', 'aria-describedby'];
const rootAttrs = computed(() => Object.fromEntries(Object.entries(attrs).filter(([k]) => !TABLE_ATTRS.includes(k))));
const tableAttrs = computed(() => Object.fromEntries(Object.entries(attrs).filter(([k]) => TABLE_ATTRS.includes(k))));
const rowsPerPage = ref(props.rows);
watch(
    () => props.rows,
    (value) => (rowsPerPage.value = value)
);

// ---- columns ---------------------------------------------------------------------

type SlotFn = (props: Record<string, unknown>) => VNode[];
interface ColumnDef {
    key: string;
    field?: string;
    header?: string;
    sortable: boolean;
    expander: boolean;
    align?: string;
    props: Record<string, unknown>;
    slots: Partial<Record<'body' | 'header' | 'aggregate', SlotFn>>;
}

const truthy = (v: unknown) => v === '' || v === true || v === 'true';
const isColumn = (vnode: VNode) => vnode.type === Column || (vnode.type as { name?: string } | null)?.name === 'VtColumn';

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
                    expander: truthy(p.expander),
                    align: p.align as string | undefined,
                    props: p,
                    slots: (children && typeof children === 'object' && !Array.isArray(children) ? children : {}) as ColumnDef['slots']
                });
            }
        }
    }
}

const columns = computed(() => {
    const out: ColumnDef[] = [];
    collect(slots.default?.(), out);
    return out;
});
const expanderKey = computed(() => (columns.value.find((c) => c.expander) ?? columns.value[0])?.key);
const VNodes: FunctionalComponent<{ vnodes: unknown }> = (p) => p.vnodes as VNode[];
const display = (value: unknown) => (value === null || value === undefined ? '' : String(value));

// ---- rows ------------------------------------------------------------------------

const filtering = computed(() => !!props.globalFilter?.trim() && !!props.globalFilterFields?.length);
const filtered = computed(() =>
    filtering.value
        ? filterTree(
              props.value as TreeNode[],
              props.globalFilter!,
              props.globalFilterFields!.map((f) => `data.${f}`),
              locale.value.code
          )
        : null
);
const sorts = computed(() => (sortField.value && sortOrder.value ? [{ field: `data.${sortField.value}`, order: sortOrder.value }] : []));
const roots = computed(() => sortTree((filtered.value?.nodes ?? props.value) as TreeNode[], sorts.value, locale.value.code));
const pageRoots = computed(() => (props.paginator ? roots.value.slice(first.value, first.value + rowsPerPage.value) : roots.value));
// The filter opens every branch leading to a match; the reader can still close
// one, which is remembered until the filter text changes.
const closedByReader = ref(new Set<string>());
watch(() => props.globalFilter, () => (closedByReader.value = new Set()));
const expanded = computed<TreeExpandedKeys>(() => {
    const opened: TreeExpandedKeys = { ...(filtered.value?.expandedKeys ?? {}) };
    for (const key of closedByReader.value) delete opened[key];
    return { ...opened, ...(expandedKeys.value ?? {}) };
});
const flat = computed(() => flattenTree(pageRoots.value, expanded.value));

// ---- totals ----------------------------------------------------------------------

// A column with `aggregate` draws, on a row with rows under it, the value
// worked out over the rows at the ends of its branches — those the filter
// left — in place of the row's own. Worked out once for the tree on show.
const totalled = computed(() => columns.value.filter((col) => col.field && col.props.aggregate));
const totals = computed(() => {
    const out = new Map<string, { values: Record<string, unknown>; rows: unknown[] }>();
    if (!totalled.value.length) return out;
    const visit = (node: TreeNode): unknown[] => {
        if (isLeaf(node)) return [node.data];
        const leaves = (node.children ?? []).flatMap(visit);
        if (node.children?.length)
            out.set(node.key, { rows: leaves, values: Object.fromEntries(totalled.value.map((col) => [col.field!, aggregateOf({ field: col.field, aggregate: col.props.aggregate as never }, leaves)])) });
        return leaves;
    };
    roots.value.forEach(visit);
    return out;
});
const totalOf = (node: TreeNode, col: ColumnDef) => (col.field && col.props.aggregate ? totals.value.get(node.key) : undefined);
/**
 * The data a cell reads: the row's own, with its totals in place of the
 * values they add up — in every cell of the row, so a column worked out
 * from others (a share, a difference) holds on a parent row as well.
 */
function cellData(node: TreeNode) {
    const total = totals.value.get(node.key);
    return total ? { ...(node.data as Record<string, unknown>), ...total.values } : node.data;
}
/** A cell's content: the `aggregate` slot for a total when there is one, else the body slot or the value. */
function cellSlot(node: TreeNode, col: ColumnDef) {
    const total = totalOf(node, col);
    if (total && col.slots.aggregate) return col.slots.aggregate({ value: total.values[col.field!], rows: total.rows, node, column: col.props });
    return col.slots.body?.({ node, data: cellData(node), field: col.field, column: col.props });
}

/** Every row with rows under it, in the tree handed in. */
function branchKeys(list: readonly TreeNodeLike[], out: string[] = []) {
    for (const node of list) {
        if (node.children?.length) {
            out.push(node.key);
            branchKeys(node.children, out);
        }
    }
    return out;
}

/** Opens every row with rows under it. */
function expandAll() {
    closedByReader.value = new Set();
    expandedKeys.value = Object.fromEntries(branchKeys(props.value).map((key) => [key, true]));
}

/** Closes every row, the ones a filter opened as well. */
function collapseAll() {
    expandedKeys.value = {};
    if (filtering.value) closedByReader.value = new Set(Object.keys(filtered.value?.expandedKeys ?? {}));
}

defineExpose({ expandAll, collapseAll });

function findNode(list: readonly TreeNodeLike[], key: string): TreeNodeLike | undefined {
    for (const node of list) {
        if (node.key === key) return node;
        const hit = node.children && findNode(node.children, key);
        if (hit) return hit;
    }
    return undefined;
}
const original = (node: TreeNode) => (findNode(props.value, node.key) ?? node) as TreeNodeLike;

function setExpanded(node: TreeNode, open: boolean) {
    if (isLeaf(node)) return;
    const next = { ...(expandedKeys.value ?? {}) };
    if (open) next[node.key] = true;
    else delete next[node.key];
    if (filtering.value) {
        const closed = new Set(closedByReader.value);
        if (open) closed.delete(node.key);
        else closed.add(node.key);
        closedByReader.value = closed;
    }
    expandedKeys.value = next;
    if (open) emit('node-expand', original(node));
    else emit('node-collapse', original(node));
}

// ---- selection --------------------------------------------------------------------

const mode = computed(() => props.selectionMode);
function checkOf(node: TreeNode) {
    const entry = selectionKeys.value?.[node.key];
    return typeof entry === 'object' && entry ? { checked: !!entry.checked, partial: !!entry.partialChecked } : { checked: false, partial: false };
}
const isSelected = (node: TreeNode) => (mode.value === 'checkbox' ? checkOf(node).checked : !!selectionKeys.value?.[node.key]);

function select(node: TreeNode) {
    if (!mode.value || node.disabled || node.selectable === false) return;
    const target = original(node);
    const keys = selectionKeys.value ?? {};
    const was = isSelected(node);
    if (mode.value === 'checkbox') selectionKeys.value = setChecked(props.value as TreeNode[], keys as CheckState, target as TreeNode, !was);
    else if (mode.value === 'single') selectionKeys.value = was ? {} : { [node.key]: true };
    else {
        const next = { ...keys };
        if (was) delete next[node.key];
        else next[node.key] = true;
        selectionKeys.value = next;
    }
    if (was) emit('node-unselect', target);
    else emit('node-select', target);
}

// ---- sorting ----------------------------------------------------------------------

function onSort(col: ColumnDef) {
    const field = String(col.props.sortField ?? col.field ?? '');
    const current = sortField.value && sortOrder.value ? [{ field: sortField.value, order: sortOrder.value }] : [];
    const next = toggleSort(current, field, { removable: props.removableSort })[0];
    sortField.value = next?.field ?? null;
    sortOrder.value = next?.order ?? null;
    if (props.paginator) first.value = 0;
    emit('sort', { sortField: sortField.value, sortOrder: sortOrder.value });
}
const sortedBy = (col: ColumnDef) => (sortField.value && sortField.value === (col.props.sortField ?? col.field) ? sortOrder.value : null);

// ---- focus and keys ----------------------------------------------------------------

const focusedKey = ref<string | null>(null);
const tabKey = computed(() => {
    if (focusedKey.value && flat.value.some((f) => f.node.key === focusedKey.value)) return focusedKey.value;
    return (flat.value.find((f) => isSelected(f.node)) ?? flat.value[0])?.node.key ?? null;
});
const rowId = (key: string) => `${id}-row-${key.replace(/[^\w-]/g, '_')}`;

function focusRow(key: string) {
    focusedKey.value = key;
    nextTick(() => document.getElementById(rowId(key))?.focus());
}

function onRowKeydown(event: KeyboardEvent, index: number) {
    if (event.target !== event.currentTarget) return;
    const row = flat.value[index]!;
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (mode.value) select(row.node);
        else if (event.key === 'Enter') setExpanded(row.node, !row.expanded);
        return;
    }
    const action = treeKeyAction(flat.value, index, event.key);
    switch (action.type) {
        case 'focus':
            event.preventDefault();
            focusRow(flat.value[action.index]!.node.key);
            break;
        case 'expand':
        case 'collapse':
            event.preventDefault();
            setExpanded(row.node, action.type === 'expand');
            break;
        case 'expandAll': {
            event.preventDefault();
            const next = { ...(expandedKeys.value ?? {}) };
            for (const key of action.keys) next[key] = true;
            expandedKeys.value = next;
            break;
        }
    }
}

function onRowClick(row: FlatNode, event: MouseEvent) {
    focusedKey.value = row.node.key;
    if ((event.target as Element).closest('button, a, input, [data-vt-toggler]')) return;
    select(row.node);
}

function onTogglerClick(row: FlatNode, event: MouseEvent) {
    event.stopPropagation();
    focusedKey.value = row.node.key;
    setExpanded(row.node, !row.expanded);
}

function onCheckboxClick(row: FlatNode, event: MouseEvent) {
    event.stopPropagation();
    focusedKey.value = row.node.key;
    select(row.node);
}

const rootState = computed(() => ({ striped: props.stripedRows, gridlines: props.showGridlines, size: props.size, scrollable: !!props.scrollHeight }));
</script>

<template>
    <div v-bind="mergeProps(rootAttrs, part('root', rootState))">
        <div v-if="$slots.header" v-bind="part('header')"><slot name="header" /></div>
        <div ref="containerRef" v-bind="part('tableContainer')" :style="scrollHeight ? { maxHeight: scrollHeight } : undefined">
            <table
                role="treegrid"
                v-bind="mergeProps(tableAttrs, part('table'))"
                :style="tableStyle"
                :aria-multiselectable="mode === 'multiple' || mode === 'checkbox' ? 'true' : undefined"
                :aria-busy="loading ? 'true' : undefined"
            >
                <caption v-if="caption" v-bind="part('caption')">{{ caption }}</caption>
                <thead v-bind="part('thead')">
                    <tr v-bind="part('headerRow')">
                        <th
                            v-for="col in columns"
                            :key="col.key"
                            scope="col"
                            v-bind="part('headerCell', { align: col.align })"
                            :aria-sort="col.sortable && sortedBy(col) ? (sortedBy(col) === 1 ? 'ascending' : 'descending') : undefined"
                        >
                            <button v-if="col.sortable" type="button" v-bind="part('sortButton')" @click="onSort(col)">
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
                    <template v-if="flat.length">
                        <tr
                            v-for="(row, index) in flat"
                            :id="rowId(row.node.key)"
                            :key="row.node.key"
                            v-bind="part('row', { selectable: !!mode, selected: isSelected(row.node) })"
                            :tabindex="row.node.key === tabKey ? 0 : -1"
                            :aria-level="row.level"
                            :aria-posinset="row.posInSet"
                            :aria-setsize="row.setSize"
                            :aria-expanded="row.leaf ? undefined : row.expanded ? 'true' : 'false'"
                            :aria-selected="mode ? (isSelected(row.node) ? 'true' : 'false') : undefined"
                            :aria-disabled="row.node.disabled ? 'true' : undefined"
                            @keydown="onRowKeydown($event, index)"
                            @click="onRowClick(row, $event)"
                            @focus="focusedKey = row.node.key"
                        >
                            <td v-for="col in columns" :key="col.key" v-bind="part('bodyCell', { align: col.align, total: !!totalOf(row.node, col) })">
                                <div v-if="col.key === expanderKey" v-bind="part('node')" :style="{ '--_depth': row.level - 1 }">
                                    <span data-vt-toggler aria-hidden="true" v-bind="part('toggler', { leaf: row.leaf, open: row.expanded })" @click="onTogglerClick(row, $event)">
                                        <Icon :icon="row.node.loading ? 'spinner' : 'chevronRight'" :spin="!!row.node.loading" v-bind="part('togglerIcon')" />
                                    </span>
                                    <span v-if="mode === 'checkbox'" data-vt-toggler aria-hidden="true" v-bind="part('checkbox', { checked: checkOf(row.node).checked, partial: checkOf(row.node).partial })" @click="onCheckboxClick(row, $event)">
                                        <Icon v-if="checkOf(row.node).checked || checkOf(row.node).partial" :icon="checkOf(row.node).checked ? 'check' : 'minus'" />
                                    </span>
                                    <VNodes v-if="col.slots.body || (col.slots.aggregate && totalOf(row.node, col))" :vnodes="cellSlot(row.node, col)" />
                                    <span v-else>{{ display(getField(cellData(row.node), col.field)) }}</span>
                                </div>
                                <template v-else>
                                    <VNodes v-if="col.slots.body || (col.slots.aggregate && totalOf(row.node, col))" :vnodes="cellSlot(row.node, col)" />
                                    <template v-else>{{ display(getField(cellData(row.node), col.field)) }}</template>
                                </template>
                            </td>
                        </tr>
                    </template>
                    <tr v-else>
                        <td :colspan="columns.length || 1" v-bind="part('emptyCell')">
                            <slot name="empty">{{ emptyMessage ?? (filtering ? locale.emptySearchMessage : locale.emptyMessage) }}</slot>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <Paginator
            v-if="paginator"
            v-model:first="first"
            v-model:rows="rowsPerPage"
            :total-records="roots.length"
            :rows-per-page-options="rowsPerPageOptions"
            :unstyled="unstyled"
            v-bind="part('paginator')"
            @page="emit('page', $event)"
        />
        <div v-if="$slots.footer" v-bind="part('footer')"><slot name="footer" /></div>
        <div v-if="loading" role="status" v-bind="part('loadingMask')">
            <slot name="loadingicon"><Icon icon="spinner" spin /></slot>
            <span class="vt-sr-only">{{ locale.loading }}</span>
        </div>
    </div>
</template>
