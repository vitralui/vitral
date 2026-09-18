<script setup lang="ts">
import { createTypeahead, flattenTree, isLeaf, isPrintableKey, rovingIndex, rovingMove, treeKeyAction, typeaheadIndex, type TreeNode } from '@vitral/core';
import { panelmenuStyle } from '@vitral/styles';
import { computed, h, mergeProps, nextTick, ref, useId, type Component, type FunctionalComponent, type VNode, type VNodeArrayChildren } from 'vue';
import { useComponent } from '../../base/useComponent';
import { useCollapseTransition } from '../../composables/useCollapseTransition';
import Icon from '../Icon/Icon.vue';
import type { MenuItem } from '../Menu/types';
import type { PanelMenuEmits, PanelMenuProps, PanelMenuSlots } from './types';

// Sections of navigation. Each section header is a button that expands its
// panel (the accordion pattern: Up/Down/Home/End move between headers); a
// header with no items is a command or a link of its own. A panel is a
// WAI-ARIA tree of its items, with core's tree keys: Up/Down move, Right and
// Left open and close branches, Enter and Space run an item or toggle a
// branch, typeahead jumps. `v-model:expanded-keys` holds what is open, keyed by
// `item.key` or the item's position (`'0_2'`).

defineOptions({ name: 'VtPanelMenu' });

const props = withDefaults(defineProps<PanelMenuProps>(), { unstyled: undefined, model: () => [] });
const expandedKeys = defineModel<Record<string, boolean>>('expandedKeys', { default: () => ({}) });
const emit = defineEmits<PanelMenuEmits>();
const slots = defineSlots<PanelMenuSlots>();

const { part, locale } = useComponent(panelmenuStyle, props);
const id = useId();
const focusedKey = ref<string | null>(null);
const typeahead = createTypeahead();
const collapse = useCollapseTransition();
const headerEls: (HTMLElement | null)[] = [];

interface Node extends TreeNode {
    item: MenuItem;
}

const shown = (item: MenuItem) => item.visible !== false;
const keyOf = (item: MenuItem, path: string) => item.key ?? path;
const toNodes = (list: readonly MenuItem[], trail: string): Node[] =>
    list.filter(shown).map((item, i) => {
        const key = keyOf(item, trail ? `${trail}_${i}` : String(i));
        return { key, label: item.label, item, disabled: item.disabled, children: item.items && !item.separator ? toNodes(item.items, key) : undefined };
    });

const panels = computed(() => toNodes(props.model, ''));
const isOpen = (key: string) => !!expandedKeys.value?.[key];
const flatOf = (panel: Node) => flattenTree((panel.children ?? []) as TreeNode[], expandedKeys.value ?? {}, 1);
const domId = (key: string) => `${id}-${key.replace(/[^A-Za-z0-9_-]/g, (c) => `_${c.charCodeAt(0).toString(16)}`)}`;

function setExpanded(key: string, open: boolean) {
    const next = { ...(expandedKeys.value ?? {}) };
    if (open) next[key] = true;
    else delete next[key];
    expandedKeys.value = next;
}

// ---- headers ------------------------------------------------------------------

function onHeaderClick(panel: Node, event: MouseEvent) {
    const { item } = panel;
    if (item.disabled) {
        event.preventDefault();
        return;
    }
    if (!panel.children?.length) {
        item.command?.({ originalEvent: event, item });
        return;
    }
    const open = !isOpen(panel.key);
    const next = { ...(expandedKeys.value ?? {}) };
    if (open && !props.multiple) for (const other of panels.value) if (other !== panel) delete next[other.key];
    if (open) next[panel.key] = true;
    else delete next[panel.key];
    expandedKeys.value = next;
    if (open) emit('panel-open', { originalEvent: event, item });
    else emit('panel-close', { originalEvent: event, item });
}

function onHeaderKeydown(index: number, event: KeyboardEvent) {
    const move = rovingMove(event.key, { orientation: 'vertical' });
    if (!move) return;
    event.preventDefault();
    const next = rovingIndex(move, panels.value.length, index, (i) => !!panels.value[i]?.item.disabled);
    headerEls[next]?.focus();
}

// ---- trees --------------------------------------------------------------------

function tabStopOf(panel: Node): string | null {
    const flat = flatOf(panel);
    if (focusedKey.value && flat.some((f) => f.node.key === focusedKey.value)) return focusedKey.value;
    return flat[0]?.node.key ?? null;
}

function focusKey(key: string) {
    focusedKey.value = key;
    nextTick(() => document.getElementById(domId(key))?.focus());
}

function run(node: Node, event: Event) {
    const { item } = node;
    if (item.disabled) return;
    if (!isLeaf(node)) {
        setExpanded(node.key, !isOpen(node.key));
        return;
    }
    const link = document.getElementById(domId(node.key))?.querySelector('a');
    if (link && event.type !== 'click') link.click();
    else item.command?.({ originalEvent: event, item });
}

function onTreeKeydown(panel: Node, event: KeyboardEvent) {
    const flat = flatOf(panel);
    const index = flat.findIndex((f) => f.node.key === (focusedKey.value ?? tabStopOf(panel)));
    const current = flat[index];
    if (!current) return;
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        run(current.node as Node, event);
        return;
    }
    const action = treeKeyAction(flat, index, event.key);
    switch (action.type) {
        case 'focus':
            event.preventDefault();
            focusKey(flat[action.index]!.node.key);
            return;
        case 'expand':
        case 'collapse':
            event.preventDefault();
            setExpanded(action.key, action.type === 'expand');
            return;
        case 'expandAll': {
            event.preventDefault();
            const next = { ...(expandedKeys.value ?? {}) };
            for (const key of action.keys) next[key] = true;
            expandedKeys.value = next;
            return;
        }
    }
    if (isPrintableKey(event) && event.key !== '*') {
        const found = typeaheadIndex(
            flat.map((f) => f.node.label ?? ''),
            typeahead.push(event.key),
            index,
            (i) => !!flat[i]?.node.disabled,
            locale.value.code
        );
        if (found >= 0) {
            event.preventDefault();
            focusKey(flat[found]!.node.key);
        }
    }
}

// ---- rendering ----------------------------------------------------------------

const IconComponent = Icon as unknown as Component;

function renderNode(node: Node, level: number, pos: number, size: number, tabStop: string | null): VNode {
    const { item } = node;
    const leaf = isLeaf(node);
    const open = !leaf && isOpen(node.key);
    const link = leaf && !!item.url;
    const content: VNodeArrayChildren = slots.item
        ? (slots.item({ item, root: false, expanded: open, hasSubmenu: !leaf }) as VNodeArrayChildren)
        : [item.icon ? h(IconComponent, mergeProps(part('icon'), { icon: item.icon })) : null, h('span', part('itemLabel'), item.label)];
    const toggle = leaf
        ? []
        : [slots.submenuicon ? (slots.submenuicon({ item, expanded: open }) as VNodeArrayChildren) : h(IconComponent, mergeProps(part('toggleIcon', { open }), { icon: 'chevronRight' }))];
    return h(
        'li',
        mergeProps(part('item', { disabled: !!item.disabled, expanded: open }), {
            key: node.key,
            id: domId(node.key),
            role: 'treeitem',
            tabindex: node.key === tabStop ? 0 : -1,
            'aria-level': level,
            'aria-posinset': pos,
            'aria-setsize': size,
            'aria-expanded': leaf ? undefined : open ? 'true' : 'false',
            'aria-disabled': item.disabled ? 'true' : undefined,
            'aria-labelledby': `${domId(node.key)}-label`,
            onFocus: (event: FocusEvent) => {
                if (event.target === event.currentTarget) focusedKey.value = node.key;
            }
        }),
        [
            h(
                link ? 'a' : 'div',
                mergeProps(part('itemContent'), {
                    id: `${domId(node.key)}-label`,
                    href: link && !item.disabled ? item.url : undefined,
                    target: link ? item.target : undefined,
                    tabindex: link ? -1 : undefined,
                    onClick: (event: MouseEvent) => {
                        focusedKey.value = node.key;
                        if (item.disabled) event.preventDefault();
                        else run(node, event);
                    }
                }),
                [...content, ...toggle]
            ),
            open && node.children?.length
                ? h(
                      'ul',
                      mergeProps(part('group'), { role: 'group' }),
                      (node.children as Node[]).map((child, i, list) => renderNode(child, level + 1, i + 1, list.length, tabStop))
                  )
                : null
        ]
    );
}

const Tree: FunctionalComponent<{ panel: Node }> = ({ panel }) => {
    const tabStop = tabStopOf(panel);
    const children = (panel.children ?? []) as Node[];
    return h(
        'ul',
        mergeProps(part('tree'), { role: 'tree', 'aria-labelledby': `${domId(panel.key)}-header`, onKeydown: (event: KeyboardEvent) => onTreeKeydown(panel, event) }),
        children.map((child, i) => renderNode(child, 1, i + 1, children.length, tabStop))
    );
};
</script>

<template>
    <div v-bind="part('root')">
        <div v-for="(panel, index) in panels" :key="panel.key" v-bind="part('panel')">
            <component
                :is="!panel.children?.length && panel.item.url ? 'a' : 'button'"
                :id="`${domId(panel.key)}-header`"
                :ref="(el: unknown) => (headerEls[index] = el as HTMLElement | null)"
                :type="!panel.children?.length && panel.item.url ? undefined : 'button'"
                :href="!panel.children?.length && !panel.item.disabled ? panel.item.url : undefined"
                :target="panel.item.target"
                :disabled="panel.item.url ? undefined : panel.item.disabled"
                :aria-disabled="panel.item.url && panel.item.disabled ? 'true' : undefined"
                :aria-expanded="panel.children?.length ? (isOpen(panel.key) ? 'true' : 'false') : undefined"
                :aria-controls="panel.children?.length && isOpen(panel.key) ? `${domId(panel.key)}-content` : undefined"
                v-bind="part('header', { disabled: panel.item.disabled, open: isOpen(panel.key) })"
                @click="onHeaderClick(panel, $event)"
                @keydown="onHeaderKeydown(index, $event)"
            >
                <slot name="item" :item="panel.item" :root="true" :expanded="isOpen(panel.key)" :has-submenu="!!panel.children?.length">
                    <Icon v-if="panel.item.icon" :icon="panel.item.icon" v-bind="part('icon')" />
                    <span v-bind="part('headerLabel')">{{ panel.item.label }}</span>
                </slot>
                <slot v-if="panel.children?.length" name="headericon" :item="panel.item" :expanded="isOpen(panel.key)">
                    <Icon icon="chevronRight" v-bind="part('toggleIcon', { open: isOpen(panel.key) })" />
                </slot>
            </component>
            <Transition name="vt-panelmenu-collapse" v-bind="collapse">
                <div v-if="panel.children?.length && isOpen(panel.key)" :id="`${domId(panel.key)}-content`" role="region" :aria-labelledby="`${domId(panel.key)}-header`" v-bind="part('content')">
                    <Tree :panel="panel" />
                </div>
            </Transition>
        </div>
    </div>
</template>
