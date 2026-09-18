<script setup lang="ts">
import {
    createTypeahead,
    hasSubmenu,
    isMenuOpen,
    isPrintableKey,
    menuKeyAction,
    menuLevel,
    pushLayer,
    typeaheadIndex,
    type MenuNavState,
    type MenuTreeAccess
} from '@vitral/core';
import { megamenuStyle } from '@vitral/styles';
import { computed, mergeProps, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue';
import { useAnchored } from '../../base/anchored';
import { useComponent } from '../../base/useComponent';
import Icon from '../Icon/Icon.vue';
import type { MenuItem } from '../Menu/types';
import type { MegaMenuItem, MegaMenuProps, MegaMenuSlots } from './types';

// A WAI-ARIA menubar (or menu, when vertical) whose items open wide panels.
// A panel is a menu of labelled groups laid out in columns; for the keyboard
// its links are one list in reading order, so Up and Down walk every column.
// Left and Right move to the same row of the neighbouring column, and past the
// last column to the neighbouring panel, as in a menubar. The moves are core's
// menu navigation over that shape. The panel is placed with position: fixed,
// so an ancestor's overflow does not clip it.

defineOptions({ name: 'VtMegaMenu' });

const props = withDefaults(defineProps<MegaMenuProps>(), { unstyled: undefined, model: () => [], orientation: 'horizontal' });
const slots = defineSlots<MegaMenuSlots>();

const { part, locale } = useComponent(megamenuStyle, props);
const autoId = useId();
const rootRef = ref<HTMLElement | null>(null);

interface Entry {
    item: MenuItem | MegaMenuItem;
    /** For a top-level item: its links, in reading order across the panel. */
    leaves?: Entry[];
    /** For a top-level item: the panel's columns, each a list of groups holding leaf indices. */
    columns?: { item: MenuItem; leaves: { entry: Entry; index: number }[] }[][];
    /** For a top-level item: each column's leaf indices, top to bottom. */
    grid?: number[][];
}

const shown = (item: { visible?: boolean }) => item.visible !== false;

const roots = computed<Entry[]>(() =>
    props.model.filter(shown).map((root) => {
        if (!root.items?.length) return { item: root };
        const leaves: Entry[] = [];
        const columns = root.items.map((column) =>
            column.filter(shown).map((group) => ({
                item: group,
                leaves: (group.items ?? []).filter(shown).map((item) => {
                    const entry: Entry = { item };
                    leaves.push(entry);
                    return { entry, index: leaves.length - 1 };
                })
            }))
        );
        const grid = columns.map((column) => column.flatMap((group) => group.leaves.map((leaf) => leaf.index)));
        return { item: root, leaves, columns, grid };
    })
);

const access: MenuTreeAccess<Entry> = { children: (entry) => entry.leaves, skip: (entry) => !!entry.item.disabled || !!entry.item.separator };
const horizontal = computed(() => props.orientation === 'horizontal');
const anchored = useAnchored('menu');
const panelPlacement = computed(() =>
    horizontal.value
        ? { reference: () => rootRef.value, placement: 'bottom-start' as const, offset: 4, matchWidth: true }
        : { reference: (el: HTMLElement) => el.previousElementSibling, placement: 'right-start' as const, offset: 4 }
);

const nav = ref<MenuNavState>({ path: [], expanded: false });
const engaged = ref(false);
const hasFocus = ref(false);
const typeahead = createTypeahead();

const idOf = (path: readonly number[]) => `${autoId}-item-${path.join('_')}`;
const tabStop = computed(() => {
    const current = nav.value.path[0];
    if (current !== undefined && roots.value[current] && !access.skip!(roots.value[current]!)) return current;
    return roots.value.findIndex((entry) => !access.skip!(entry));
});
const pathOf = (el: Element | null) => {
    const value = el?.closest<HTMLElement>('[data-vt-path]')?.dataset.vtPath;
    return value === undefined ? null : value.split('_').map(Number);
};

function moveTo(state: MenuNavState, focus = true) {
    nav.value = state;
    if (state.path.length > 1 || state.expanded) engaged.value = true;
    if (focus && state.path.length) nextTick(() => document.getElementById(idOf(state.path))?.focus());
}

function collapse() {
    nav.value = { path: nav.value.path.slice(0, 1), expanded: false };
    engaged.value = false;
}

// A press outside closes an open panel.
let releaseLayer: (() => void) | null = null;
watch(
    () => nav.value.path.length > 1 || nav.value.expanded,
    (open) => {
        releaseLayer?.();
        releaseLayer = open ? pushLayer({ elements: () => [rootRef.value], onPointerDownOutside: () => collapse() }) : null;
    }
);
onBeforeUnmount(() => releaseLayer?.());

function activate(path: number[], event: Event) {
    const entry = path.length === 1 ? roots.value[path[0]!] : roots.value[path[0]!]?.leaves?.[path[1]!];
    if (!entry || entry.item.disabled) return;
    if (hasSubmenu(entry, access)) {
        const open = isMenuOpen(nav.value, path);
        moveTo({ path, expanded: !open }, false);
        return;
    }
    entry.item.command?.({ originalEvent: event, item: entry.item as MenuItem });
    collapse();
}

/** The leaf at about the same height in the next column that has an enabled one, or -1. */
function neighbourColumnLeaf(root: Entry, leaf: number, step: 1 | -1): number {
    const grid = root.grid ?? [];
    const column = grid.findIndex((col) => col.includes(leaf));
    if (column < 0) return -1;
    const row = grid[column]!.indexOf(leaf);
    for (let c = column + step; c >= 0 && c < grid.length; c += step) {
        const enabled = grid[c]!.filter((index) => !access.skip!(root.leaves![index]!));
        if (!enabled.length) continue;
        return enabled.reduce((best, index) => (Math.abs(grid[c]!.indexOf(index) - row) < Math.abs(grid[c]!.indexOf(best) - row) ? index : best));
    }
    return -1;
}

function onKeydown(event: KeyboardEvent) {
    const from = pathOf(event.target as Element) ?? nav.value.path;
    if (event.key === 'Tab') {
        collapse();
        return;
    }
    const state = { path: from, expanded: nav.value.expanded && from.join() === nav.value.path.join() };
    const rtl = getComputedStyle(event.currentTarget as Element).direction === 'rtl';
    if (from.length === 2 && horizontal.value && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
        const step = (event.key === 'ArrowRight') !== rtl ? 1 : -1;
        const target = neighbourColumnLeaf(roots.value[from[0]!]!, from[1]!, step);
        if (target >= 0) {
            event.preventDefault();
            moveTo({ path: [from[0]!, target], expanded: false });
            return;
        }
    }
    const result = menuKeyAction(roots.value, state, event.key, access, { horizontal: horizontal.value, rtl });
    switch (result.type) {
        case 'move':
            event.preventDefault();
            moveTo(result.state);
            return;
        case 'activate':
            event.preventDefault();
            document.getElementById(idOf(result.state.path))?.click();
            return;
    }
    if (isPrintableKey(event)) {
        const level = menuLevel(roots.value, from, from.length - 1, access);
        const index = typeaheadIndex(
            level.map((entry) => entry.item.label ?? ''),
            typeahead.push(event.key),
            from[from.length - 1] ?? -1,
            (i) => access.skip!(level[i]!),
            locale.value.code
        );
        if (index >= 0) {
            event.preventDefault();
            moveTo({ path: [...from.slice(0, -1), index], expanded: false });
        }
    }
}

function onFocusin(event: FocusEvent) {
    hasFocus.value = true;
    const path = pathOf(event.target as Element);
    if (path && path.join() !== nav.value.path.join()) nav.value = { path, expanded: false };
}

function onFocusout(event: FocusEvent) {
    const next = event.relatedTarget as Node | null;
    if (!next || !(event.currentTarget as HTMLElement).contains(next)) {
        hasFocus.value = false;
        if (next) collapse();
    }
}

function onRootHover(index: number) {
    const entry = roots.value[index]!;
    if (!engaged.value || access.skip!(entry)) return;
    nav.value = { path: [index], expanded: hasSubmenu(entry, access) };
    if (hasFocus.value) document.getElementById(idOf([index]))?.focus({ preventScroll: true });
}

function itemAttrs(entry: Entry, path: number[]) {
    const root = path.length === 1;
    const parent = root && hasSubmenu(entry, access);
    const open = parent && isMenuOpen(nav.value, path);
    const link = !!entry.item.url && !parent;
    return {
        id: idOf(path),
        'data-vt-path': path.join('_'),
        role: 'menuitem',
        tabindex: root && path[0] === tabStop.value ? 0 : -1,
        href: link && !entry.item.disabled ? entry.item.url : undefined,
        target: link ? entry.item.target : undefined,
        'aria-disabled': entry.item.disabled ? 'true' : undefined,
        'aria-haspopup': parent ? 'menu' : undefined,
        'aria-expanded': parent ? (open ? 'true' : 'false') : undefined,
        'aria-controls': open ? `${idOf(path)}-panel` : undefined
    };
}

const isFocused = (path: number[]) => hasFocus.value && nav.value.path.join() === path.join();
</script>

<template>
    <div ref="rootRef" v-bind="part('root', { orientation })">
        <div v-if="$slots.start" v-bind="part('start')"><slot name="start" /></div>
        <ul
            :role="horizontal ? 'menubar' : 'menu'"
            :aria-orientation="orientation"
            :aria-label="ariaLabel"
            :aria-labelledby="ariaLabelledby"
            v-bind="part('rootList')"
            @keydown="onKeydown"
            @focusin="onFocusin"
            @focusout="onFocusout"
        >
            <li
                v-for="(entry, r) in roots"
                :key="entry.item.key ?? r"
                role="none"
                v-bind="mergeProps(part('item', { root: true, disabled: !!entry.item.disabled, active: isMenuOpen(nav, [r]), focused: isFocused([r]) }), { class: entry.item.class })"
            >
                <component
                    :is="entry.item.url && !entry.leaves ? 'a' : 'div'"
                    v-bind="mergeProps(part('itemContent'), itemAttrs(entry, [r]))"
                    @click="entry.item.disabled ? $event.preventDefault() : activate([r], $event)"
                    @mouseenter="onRootHover(r)"
                >
                    <slot name="item" :item="entry.item" :root="true" :focused="isFocused([r])" :open="isMenuOpen(nav, [r])">
                        <Icon v-if="entry.item.icon" :icon="entry.item.icon" v-bind="part('itemIcon')" />
                        <span v-bind="part('itemLabel')">{{ entry.item.label }}</span>
                        <Icon v-if="entry.leaves" :icon="horizontal ? 'chevronDown' : 'chevronRight'" v-bind="part('submenuIcon')" />
                    </slot>
                </component>
                <div
                    v-if="entry.columns && isMenuOpen(nav, [r])"
                    :id="`${idOf([r])}-panel`"
                    role="menu"
                    :aria-labelledby="idOf([r])"
                    v-bind="mergeProps(part('panel'), anchored.hooks(panelPlacement))"
                >
                    <div v-for="(column, c) in entry.columns" :key="c" role="none" v-bind="part('column')">
                        <ul v-for="(group, g) in column" :key="g" role="group" :aria-labelledby="`${idOf([r])}-group-${c}-${g}`" v-bind="part('group')">
                            <li :id="`${idOf([r])}-group-${c}-${g}`" role="presentation" v-bind="part('groupLabel')">{{ group.item.label }}</li>
                            <li
                                v-for="leaf in group.leaves"
                                :key="leaf.index"
                                role="none"
                                v-bind="mergeProps(part('item', { disabled: !!leaf.entry.item.disabled, focused: isFocused([r, leaf.index]) }), { class: leaf.entry.item.class })"
                            >
                                <component
                                    :is="leaf.entry.item.url ? 'a' : 'div'"
                                    v-bind="mergeProps(part('itemContent'), itemAttrs(leaf.entry, [r, leaf.index]))"
                                    @click="leaf.entry.item.disabled ? $event.preventDefault() : activate([r, leaf.index], $event)"
                                >
                                    <slot name="item" :item="leaf.entry.item" :root="false" :focused="isFocused([r, leaf.index])" :open="false">
                                        <Icon v-if="leaf.entry.item.icon" :icon="leaf.entry.item.icon" v-bind="part('itemIcon')" />
                                        <span v-bind="part('itemLabel')">{{ leaf.entry.item.label }}</span>
                                    </slot>
                                </component>
                            </li>
                        </ul>
                    </div>
                </div>
            </li>
        </ul>
        <div v-if="$slots.end" v-bind="part('end')"><slot name="end" /></div>
    </div>
</template>
