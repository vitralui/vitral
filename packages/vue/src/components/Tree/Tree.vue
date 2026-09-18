<script setup lang="ts">
import { createTypeahead, filterTree, flattenTree, isLeaf, isPrintableKey, setChecked, treeKeyAction, typeaheadIndex, type CheckState, type TreeNode } from '@vitral/core';
import { treeStyle } from '@vitral/styles';
import { computed, h, mergeProps, nextTick, ref, useId, watch, type FunctionalComponent, type VNode, type VNodeArrayChildren } from 'vue';
import { useComponent, useSplitAttrs } from '../../base/useComponent';
import Icon from '../Icon/Icon.vue';
import type { TreeEmits, TreeExpandedKeys, TreeNodeLike, TreeProps, TreeSelectionKeys, TreeSlots } from './types';

// The WAI-ARIA tree view. Items nest in the DOM (children sit in a
// role="group" inside their parent's treeitem) and carry their level and
// position; the tree keeps one tab stop and moves focus between items itself
// (roving tabindex). Keyboard order comes from core's flattenTree, and the
// keys from core's treeKeyAction, so another framework's tree agrees.

defineOptions({ name: 'VtTree', inheritAttrs: false });

const props = withDefaults(defineProps<TreeProps>(), { unstyled: undefined, value: () => [], filterBy: 'label' });
const expandedKeys = defineModel<TreeExpandedKeys>('expandedKeys', { default: () => ({}) });
const selectionKeys = defineModel<TreeSelectionKeys>('selectionKeys', { default: () => ({}) });
const emit = defineEmits<TreeEmits>();
const slots = defineSlots<TreeSlots>();

const { part, locale } = useComponent(treeStyle, props);
const { rootAttrs, controlAttrs } = useSplitAttrs();

const id = useId();
const treeId = computed(() => (controlAttrs.value.id as string | undefined) ?? `${id}-tree`);
const query = ref('');
const focusedKey = ref<string | null>(null);
const typeahead = createTypeahead();

// ---- what is visible --------------------------------------------------------

const filterFields = computed(() => (Array.isArray(props.filterBy) ? props.filterBy : props.filterBy.split(',').map((f) => f.trim())));
const filtering = computed(() => !!props.filter && query.value.trim() !== '');
const filtered = computed(() => filterTree(props.value as TreeNode[], query.value, filterFields.value, locale.value.code));
// While a search is on, expansion is the search's own (every match opened), and toggling
// does not disturb the expansion the app bound; clearing the search brings that back.
const filterExpanded = ref<TreeExpandedKeys>({});
watch(
    () => filtered.value.expandedKeys,
    (keys) => (filterExpanded.value = { ...keys })
);

const nodes = computed<TreeNodeLike[]>(() => (filtering.value ? (filtered.value.nodes as TreeNodeLike[]) : props.value));
const expanded = computed<TreeExpandedKeys>(() => (filtering.value ? filterExpanded.value : (expandedKeys.value ?? {})));
const flat = computed(() => flattenTree(nodes.value as TreeNode[], expanded.value));
const indexOfKey = computed(() => new Map(flat.value.map((f, i) => [f.node.key, i])));

// ---- selection ---------------------------------------------------------------

const mode = computed(() => props.selectionMode);
const isSelectable = (node: TreeNodeLike) => !!mode.value && !node.disabled && node.selectable !== false;
const isSelected = (node: TreeNodeLike) => mode.value !== 'checkbox' && !!selectionKeys.value?.[node.key];
function checkOf(node: TreeNodeLike): { checked: boolean; partial: boolean } {
    const entry = selectionKeys.value?.[node.key];
    return typeof entry === 'object' && entry !== null ? { checked: !!entry.checked, partial: !!entry.partialChecked } : { checked: false, partial: false };
}

function findNode(list: readonly TreeNodeLike[], key: string): TreeNodeLike | undefined {
    for (const node of list) {
        if (node.key === key) return node;
        const hit = node.children && findNode(node.children, key);
        if (hit) return hit;
    }
    return undefined;
}
/** A filtered node is a pruned copy; events and checks work on the node the app gave us. */
const original = (node: TreeNodeLike) => findNode(props.value, node.key) ?? node;

function select(node: TreeNodeLike) {
    if (!isSelectable(node)) return;
    const target = original(node);
    const keys = selectionKeys.value ?? {};
    if (mode.value === 'checkbox') {
        const checked = !checkOf(node).checked;
        selectionKeys.value = setChecked(props.value as TreeNode[], keys as CheckState, target as TreeNode, checked);
        if (checked) emit('node-select', target);
        else emit('node-unselect', target);
        return;
    }
    const was = !!keys[node.key];
    if (mode.value === 'single') {
        selectionKeys.value = was ? {} : { [node.key]: true };
    } else {
        const next = { ...keys };
        if (was) delete next[node.key];
        else next[node.key] = true;
        selectionKeys.value = next;
    }
    if (was) emit('node-unselect', target);
    else emit('node-select', target);
}

// ---- expansion ---------------------------------------------------------------

/** Opens or closes several nodes in one update, so a bound v-model sees one change and not the last of many. */
function setExpanded(list: readonly TreeNodeLike[], open: boolean) {
    if (list.length === 0) return;
    const next = { ...(filtering.value ? filterExpanded.value : (expandedKeys.value ?? {})) };
    for (const node of list) {
        if (open) next[node.key] = true;
        else delete next[node.key];
    }
    if (filtering.value) filterExpanded.value = next;
    else expandedKeys.value = next;
    // A branch with `leaf: false` and no children asks the app for them here.
    for (const node of list) {
        if (open) emit('node-expand', original(node));
        else emit('node-collapse', original(node));
    }
}

function toggleExpanded(node: TreeNodeLike) {
    if (!isLeaf(node as TreeNode)) setExpanded([node], !expanded.value[node.key]);
}

// ---- focus and keyboard --------------------------------------------------------

/** The one item in the tab order: the last focused, else the first selected, else the first. */
const tabStopKey = computed<string | null>(() => {
    if (focusedKey.value !== null && indexOfKey.value.has(focusedKey.value)) return focusedKey.value;
    const selected = flat.value.find((f) => (mode.value === 'checkbox' ? checkOf(f.node as TreeNodeLike).checked : isSelected(f.node as TreeNodeLike)));
    return (selected ?? flat.value[0])?.node.key ?? null;
});

const domId = (key: string) => `${id}-node-${key.replace(/[^A-Za-z0-9_-]/g, (c) => `_${c.charCodeAt(0).toString(16)}`)}`;

function focusKey(key: string) {
    focusedKey.value = key;
    nextTick(() => document.getElementById(domId(key))?.focus());
}

function onKeydown(event: KeyboardEvent) {
    const key = focusedKey.value !== null && indexOfKey.value.has(focusedKey.value) ? focusedKey.value : tabStopKey.value;
    if (key === null) return;
    const index = indexOfKey.value.get(key) ?? 0;
    const node = flat.value[index]?.node as TreeNodeLike | undefined;
    if (!node) return;

    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (mode.value) select(node);
        else if (event.key === 'Enter') toggleExpanded(node);
        return;
    }

    const action = treeKeyAction(flat.value, index, event.key);
    switch (action.type) {
        case 'focus':
            event.preventDefault();
            focusKey(flat.value[action.index]!.node.key);
            return;
        case 'expand':
        case 'collapse':
            event.preventDefault();
            setExpanded([node], action.type === 'expand');
            return;
        case 'expandAll':
            event.preventDefault();
            setExpanded(
                action.keys.map((k) => flat.value[indexOfKey.value.get(k)!]!.node as TreeNodeLike),
                true
            );
            return;
    }

    if (isPrintableKey(event) && event.key !== '*') {
        const q = typeahead.push(event.key);
        const found = typeaheadIndex(
            flat.value.map((f) => f.node.label ?? ''),
            q,
            index,
            undefined,
            locale.value.code
        );
        if (found >= 0) {
            event.preventDefault();
            focusKey(flat.value[found]!.node.key);
        }
    }
}

function onContentClick(node: TreeNodeLike) {
    focusedKey.value = node.key;
    if (mode.value) select(node);
    else toggleExpanded(node);
}

function onTogglerClick(node: TreeNodeLike, event: MouseEvent) {
    event.stopPropagation();
    focusedKey.value = node.key;
    toggleExpanded(node);
}

function onFilterInput(event: Event) {
    query.value = (event.target as HTMLInputElement).value;
    emit('filter', query.value);
}

function onFilterKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown' && tabStopKey.value !== null) {
        event.preventDefault();
        focusKey(tabStopKey.value);
    }
}

const emptyText = computed(() => (filtering.value ? locale.value.emptySearchMessage : (props.emptyMessage ?? locale.value.emptyMessage)));

// ---- rendering -----------------------------------------------------------------
// Written as a render function because the markup recurses; every element still
// gets its `part()`.

// Merged pass-through attributes are untyped; hand them to Icon as to any component.
const IconComponent = Icon as unknown as import('vue').Component;

function renderNode(node: TreeNodeLike, level: number, posInSet: number, setSize: number): VNode {
    const leaf = isLeaf(node as TreeNode);
    const open = !leaf && !!expanded.value[node.key];
    const checkbox = mode.value === 'checkbox';
    const check = checkOf(node);
    const selected = isSelected(node);
    const labelId = `${domId(node.key)}-label`;

    const togglerContent: VNodeArrayChildren | undefined = leaf
        ? undefined
        : slots.togglericon
          ? (slots.togglericon({ node, expanded: open }) as VNodeArrayChildren)
          : [h(IconComponent, mergeProps(part('togglerIcon'), { icon: node.loading ? 'spinner' : 'chevronRight', spin: !!node.loading }))];

    const content = h('div', mergeProps(part('content'), { style: { '--_depth': level - 1 }, onClick: () => onContentClick(node) }), [
        h('span', mergeProps(part('toggler', { leaf }), { 'aria-hidden': 'true', onClick: (e: MouseEvent) => onTogglerClick(node, e) }), togglerContent),
        checkbox
            ? h(
                  'span',
                  mergeProps(part('checkbox', { checked: check.checked, partial: check.partial }), { 'aria-hidden': 'true' }),
                  check.checked || check.partial ? [h(IconComponent, mergeProps(part('checkboxIcon'), { icon: check.checked ? 'check' : 'minus' }))] : undefined
              )
            : null,
        node.icon ? h(IconComponent, mergeProps(part('nodeIcon'), { icon: node.icon })) : null,
        h(
            'span',
            mergeProps(part('label'), { id: labelId }),
            slots.default
                ? (slots.default({ node, expanded: open, selected, checked: check.checked, partialChecked: check.partial, level, leaf }) as VNodeArrayChildren)
                : node.label
        )
    ]);

    const children =
        open && node.children?.length
            ? h(
                  'ul',
                  mergeProps(part('group'), { role: 'group' }),
                  node.children.map((child, i, list) => renderNode(child, level + 1, i + 1, list.length))
              )
            : null;

    return h(
        'li',
        mergeProps(part('node', { selected, expanded: open, disabled: !!node.disabled, leaf }), {
            key: node.key,
            id: domId(node.key),
            role: 'treeitem',
            tabindex: node.key === tabStopKey.value ? 0 : -1,
            // Named by its own label only — not by the text of the children nested inside it.
            'aria-labelledby': labelId,
            'aria-level': level,
            'aria-setsize': setSize,
            'aria-posinset': posInSet,
            'aria-expanded': leaf ? undefined : open ? 'true' : 'false',
            // Single select marks only the chosen item; multiple marks every selectable one.
            'aria-selected': mode.value === 'single' ? (selected ? 'true' : undefined) : mode.value === 'multiple' && node.selectable !== false ? (selected ? 'true' : 'false') : undefined,
            'aria-checked': checkbox ? (check.partial ? 'mixed' : check.checked ? 'true' : 'false') : undefined,
            'aria-disabled': node.disabled ? 'true' : undefined,
            'aria-busy': node.loading ? 'true' : undefined,
            onFocus: (event: FocusEvent) => {
                if (event.target === event.currentTarget) focusedKey.value = node.key;
            }
        }),
        [content, children]
    );
}

const TreeItems: FunctionalComponent<{ nodes: readonly TreeNodeLike[] }> = (p) => p.nodes.map((node, i) => renderNode(node, 1, i + 1, p.nodes.length));

defineExpose({
    focus: () => {
        if (tabStopKey.value !== null) focusKey(tabStopKey.value);
    }
});
</script>

<template>
    <div v-bind="mergeProps(rootAttrs, part('root'))">
        <div v-if="filter" v-bind="part('filter')">
            <Icon icon="search" />
            <input
                v-bind="part('filterInput')"
                type="text"
                role="searchbox"
                autocomplete="off"
                :value="query"
                :placeholder="filterPlaceholder ?? locale.search"
                :aria-label="filterPlaceholder ?? locale.search"
                :aria-controls="treeId"
                @input="onFilterInput"
                @keydown="onFilterKeydown"
            />
        </div>
        <div v-if="loading" role="status" v-bind="part('loading')">
            <Icon icon="spinner" spin />
            <span>{{ locale.loading }}</span>
        </div>
        <ul
            role="tree"
            v-bind="mergeProps(controlAttrs, part('container'))"
            :id="treeId"
            :aria-multiselectable="selectionMode === 'multiple' || selectionMode === 'checkbox' ? 'true' : undefined"
            :aria-busy="loading ? 'true' : undefined"
            :style="scrollHeight ? { maxHeight: scrollHeight } : undefined"
            @keydown="onKeydown"
        >
            <TreeItems :nodes="nodes" />
        </ul>
        <div v-if="!flat.length && !loading" role="status" v-bind="part('empty')">
            <slot name="empty">{{ emptyText }}</slot>
        </div>
    </div>
</template>
