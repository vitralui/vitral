<script setup lang="ts">
import { flattenTree, treeKeyAction, type TreeNode } from '@vitral/core';
import { organizationchartStyle } from '@vitral/styles';
import { computed, h, mergeProps, nextTick, ref, useId, type Component, type FunctionalComponent, type VNode, type VNodeArrayChildren } from 'vue';
import { useComponent, useSplitAttrs } from '../../base/useComponent';
import Icon from '../Icon/Icon.vue';
import type { OrganizationChartEmits, OrganizationChartNode, OrganizationChartProps, OrganizationChartSlots } from './types';

// A tree drawn as a chart, and announced as one: a WAI-ARIA tree whose items
// nest in groups. One node is in the tab order; Up and Down walk the nodes in
// reading order (depth first), Right opens a folded node or enters it, Left
// folds it or goes to the parent, Home and End jump — core's tree keys — and
// Enter or Space select. The fold buttons are for the pointer.

defineOptions({ name: 'VtOrganizationChart', inheritAttrs: false });

const props = withDefaults(defineProps<OrganizationChartProps>(), { unstyled: undefined });
const selectionKeys = defineModel<Record<string, boolean>>('selectionKeys', { default: () => ({}) });
const collapsedKeys = defineModel<Record<string, boolean>>('collapsedKeys', { default: () => ({}) });
const emit = defineEmits<OrganizationChartEmits>();
const slots = defineSlots<OrganizationChartSlots>();

const { part, locale } = useComponent(organizationchartStyle, props);
// Class and style dress the scroller; the name and the rest go to the tree.
const { rootAttrs, controlAttrs } = useSplitAttrs();
const id = useId();
const focusedKey = ref<string | null>(null);

const roots = computed(() => (props.value ? [props.value] : []));
const canFold = (node: OrganizationChartNode) => !!props.collapsible && node.collapsible !== false && !!node.children?.length;
const isOpen = (node: OrganizationChartNode) => !canFold(node) || !collapsedKeys.value?.[node.key];

/** Every node that has children and is not folded counts as expanded. */
const expandedKeys = computed(() => {
    const out: Record<string, boolean> = {};
    const walk = (list: readonly OrganizationChartNode[]) =>
        list.forEach((node) => {
            if (node.children?.length && isOpen(node)) out[node.key] = true;
            if (node.children) walk(node.children);
        });
    walk(roots.value);
    return out;
});
const flat = computed(() => flattenTree(roots.value as TreeNode[], expandedKeys.value));
const tabKey = computed(() => (focusedKey.value && flat.value.some((f) => f.node.key === focusedKey.value) ? focusedKey.value : (flat.value[0]?.node.key ?? null)));
const domId = (key: string) => `${id}-${key.replace(/[^\w-]/g, '_')}`;

const selectable = (node: OrganizationChartNode) => !!props.selectionMode && node.selectable !== false;
const isSelected = (node: OrganizationChartNode) => !!selectionKeys.value?.[node.key];

function select(node: OrganizationChartNode) {
    if (!selectable(node)) return;
    const was = isSelected(node);
    if (props.selectionMode === 'single') selectionKeys.value = was ? {} : { [node.key]: true };
    else {
        const next = { ...(selectionKeys.value ?? {}) };
        if (was) delete next[node.key];
        else next[node.key] = true;
        selectionKeys.value = next;
    }
    if (was) emit('node-unselect', node);
    else emit('node-select', node);
}

function setOpen(node: OrganizationChartNode, open: boolean) {
    if (!canFold(node)) return;
    const next = { ...(collapsedKeys.value ?? {}) };
    if (open) delete next[node.key];
    else next[node.key] = true;
    collapsedKeys.value = next;
    if (open) emit('node-expand', node);
    else emit('node-collapse', node);
}

function focusKey(key: string) {
    focusedKey.value = key;
    nextTick(() => document.getElementById(domId(key))?.focus());
}

function onKeydown(event: KeyboardEvent) {
    const index = flat.value.findIndex((f) => f.node.key === (focusedKey.value ?? tabKey.value));
    const current = flat.value[index]?.node as OrganizationChartNode | undefined;
    if (!current) return;
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        select(current);
        return;
    }
    const action = treeKeyAction(flat.value, index, event.key);
    if (action.type === 'none') return;
    event.preventDefault();
    if (action.type === 'focus') focusKey(flat.value[action.index]!.node.key);
    else if (action.type === 'expand' || action.type === 'collapse') {
        if (canFold(current)) setOpen(current, action.type === 'expand');
    } else if (action.type === 'expandAll') {
        const next = { ...(collapsedKeys.value ?? {}) };
        for (const key of action.keys) delete next[key];
        collapsedKeys.value = next;
    }
}

const IconComponent = Icon as unknown as Component;

function renderNode(node: OrganizationChartNode, level: number, pos: number, size: number): VNode {
    const open = isOpen(node);
    const hasChildren = !!node.children?.length;
    const slot = (node.type && slots[node.type]) || slots.default;
    const content: VNodeArrayChildren = slot ? (slot({ node }) as VNodeArrayChildren) : [node.label ?? ''];
    const labelId = `${domId(node.key)}-label`;
    return h(
        'li',
        mergeProps(part('item'), {
            key: node.key,
            id: domId(node.key),
            role: 'treeitem',
            tabindex: node.key === tabKey.value ? 0 : -1,
            'aria-labelledby': labelId,
            'aria-level': level,
            'aria-posinset': pos,
            'aria-setsize': size,
            'aria-expanded': hasChildren ? (open ? 'true' : 'false') : undefined,
            'aria-selected': selectable(node) ? (isSelected(node) ? 'true' : 'false') : undefined,
            onFocus: (event: FocusEvent) => {
                if (event.target === event.currentTarget) focusedKey.value = node.key;
            }
        }),
        [
            h(
                'div',
                mergeProps(part('node', { selectable: selectable(node), selected: isSelected(node) }), {
                    id: labelId,
                    class: node.styleClass,
                    onClick: () => {
                        focusedKey.value = node.key;
                        select(node);
                    }
                }),
                [
                    ...content,
                    canFold(node)
                        ? h(
                              'span',
                              mergeProps(part('toggler'), {
                                  'aria-hidden': 'true',
                                  title: open ? locale.value.aria.collapse : locale.value.aria.expand,
                                  onClick: (event: MouseEvent) => {
                                      event.stopPropagation();
                                      focusedKey.value = node.key;
                                      setOpen(node, !open);
                                  }
                              }),
                              [h(IconComponent, { icon: open ? 'chevronUp' : 'chevronDown' })]
                          )
                        : null
                ]
            ),
            hasChildren && open
                ? h(
                      'ul',
                      mergeProps(part('group'), { role: 'group' }),
                      node.children!.map((child, i, list) => renderNode(child, level + 1, i + 1, list.length))
                  )
                : null
        ]
    );
}

const Chart: FunctionalComponent = () => roots.value.map((node) => renderNode(node, 1, 1, 1));
</script>

<template>
    <div v-bind="mergeProps(rootAttrs, part('root'))">
        <ul role="tree" :aria-multiselectable="selectionMode === 'multiple' ? 'true' : undefined" v-bind="mergeProps(controlAttrs, part('list'))" @keydown="onKeydown">
            <Chart />
        </ul>
    </div>
</template>
