<script setup lang="ts">
import { equals, getField, isMenuOpen, menuItemAt, menuKeyAction, type MenuNavState, type MenuTreeAccess } from '@vitral/core';
import { cascadeselectStyle } from '@vitral/styles';
import { computed, h, mergeProps, nextTick, ref, useId, type FunctionalComponent, type VNode, type VNodeArrayChildren } from 'vue';
import { useAnchored } from '../../base/anchored';
import { useComponent, useSplitAttrs } from '../../base/useComponent';
import { useOverlay } from '../../composables/useOverlay';
import Icon from '../Icon/Icon.vue';
import type { CascadeSelectEmits, CascadeSelectProps, CascadeSelectSlots } from './types';
import { useOverlayTarget } from '../../composables/useOverlayTarget';

// A select-only combobox whose popup is a WAI-ARIA tree drawn as columns: each
// group opens the next level beside it. Focus stays on the combobox and the
// active item is conveyed by aria-activedescendant. Up and Down move within a
// column, Right (or Enter) opens a group, Left and Escape go back a column,
// Enter chooses an option; the moves are core's menu navigation.

defineOptions({ name: 'VtCascadeSelect', inheritAttrs: false });

const props = withDefaults(defineProps<CascadeSelectProps>(), {
    unstyled: undefined,
    variant: undefined,
    options: () => [],
    optionGroupChildren: 'items',
    placement: 'bottom-start',
    appendTo: 'body'
});
const overlayTarget = useOverlayTarget(() => props.appendTo);
const model = defineModel<unknown>();
const emit = defineEmits<CascadeSelectEmits>();
const slots = defineSlots<CascadeSelectSlots>();

const { part, config, locale } = useComponent(cascadeselectStyle, props);
const { rootAttrs, controlAttrs } = useSplitAttrs();

const id = useId();
const treeId = `${id}-tree`;
const itemId = (path: readonly number[]) => `${id}-item-${path.join('_')}`;

const rootRef = ref<HTMLElement | null>(null);
const triggerRef = ref<HTMLButtonElement | null>(null);
const overlayRef = ref<HTMLElement | null>(null);
const open = ref(false);
const nav = ref<MenuNavState>({ path: [], expanded: false });
const labelFromFor = ref<string>();

const childFields = computed(() => (Array.isArray(props.optionGroupChildren) ? props.optionGroupChildren : [props.optionGroupChildren]));
function childrenOf(option: unknown): unknown[] | undefined {
    for (const field of childFields.value) {
        const list = getField(option, field);
        if (Array.isArray(list)) return list;
    }
    return undefined;
}
const isGroup = (option: unknown) => (childrenOf(option)?.length ?? 0) > 0;
const isDisabled = (option: unknown) => !!(props.optionDisabled && getField(option, props.optionDisabled));
const access: MenuTreeAccess<unknown> = { children: childrenOf, skip: isDisabled };

function labelOf(option: unknown): string {
    const field = isGroup(option) ? (props.optionGroupLabel ?? props.optionLabel) : props.optionLabel;
    const value = field ? getField(option, field) : option;
    return value === null || value === undefined ? '' : String(value);
}
const valueOf = (option: unknown) => (props.optionValue ? getField(option, props.optionValue) : option);
const compareKey = computed(() => (props.optionValue ? undefined : props.dataKey));
const isChosen = (option: unknown) => !isGroup(option) && model.value !== null && model.value !== undefined && equals(model.value, valueOf(option), compareKey.value);

/** The path to the chosen option, so the popup opens on it. */
function pathToChosen(list: readonly unknown[], trail: number[] = []): number[] | null {
    for (let i = 0; i < list.length; i++) {
        const option = list[i];
        if (isChosen(option)) return [...trail, i];
        const children = childrenOf(option);
        const found = children && pathToChosen(children, [...trail, i]);
        if (found) return found;
    }
    return null;
}

const chosenPath = computed(() => pathToChosen(props.options));
const chosenOption = computed(() => (chosenPath.value ? menuItemAt(props.options, chosenPath.value, access) : undefined));
const hasValue = computed(() => chosenOption.value !== undefined);
const activeId = computed(() => (open.value && nav.value.path.length ? itemId(nav.value.path) : undefined));

const state = computed(() => ({
    size: props.size,
    variant: props.variant ?? config.inputVariant,
    invalid: props.invalid,
    disabled: props.disabled,
    fluid: props.fluid,
    focused: open.value,
    open: open.value,
    placeholder: !hasValue.value
}));

const treeLabelledBy = computed(() => (controlAttrs.value['aria-labelledby'] as string | undefined) ?? labelFromFor.value);
const treeLabel = computed(() => (controlAttrs.value['aria-label'] as string | undefined) ?? props.placeholder ?? locale.value.choose);

useOverlay({
    anchor: rootRef,
    overlay: overlayRef,
    placement: () => props.placement,
    onEscape: () => hide(),
    onPointerDownOutside: () => hide(false)
});

function firstPath(): number[] {
    const index = props.options.findIndex((option) => !isDisabled(option));
    return index >= 0 ? [index] : [];
}

function show() {
    if (props.disabled || open.value) return;
    const label = triggerRef.value?.labels?.[0];
    if (label) {
        label.id ||= `${id}-label`;
        labelFromFor.value = label.id;
    }
    nav.value = { path: chosenPath.value ?? firstPath(), expanded: false };
    open.value = true;
    emit('show');
    scrollToActive();
}

function hide(returnFocus = true) {
    if (!open.value) return;
    open.value = false;
    nav.value = { path: [], expanded: false };
    emit('hide');
    if (returnFocus) triggerRef.value?.focus();
}

function scrollToActive() {
    nextTick(() => {
        if (activeId.value) document.getElementById(activeId.value)?.scrollIntoView?.({ block: 'nearest' });
    });
}

function moveTo(next: MenuNavState, event?: Event) {
    const opened = next.path.length > nav.value.path.length || (next.expanded && !nav.value.expanded);
    nav.value = next;
    if (opened) emit('group-change', { originalEvent: event, value: menuItemAt(props.options, next.path.slice(0, -1), access) });
    scrollToActive();
}

function choose(path: readonly number[], event: Event) {
    const option = menuItemAt(props.options, path, access);
    if (option === undefined || isDisabled(option) || isGroup(option)) return;
    const value = valueOf(option);
    const changed = !isChosen(option);
    model.value = value;
    if (changed) emit('change', { originalEvent: event, value });
    hide();
}

function clear(event: Event) {
    model.value = null;
    emit('change', { originalEvent: event, value: null });
    triggerRef.value?.focus();
}

function onTriggerKeydown(event: KeyboardEvent) {
    if (props.disabled) return;
    if (!open.value) {
        if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
            event.preventDefault();
            show();
        } else if ((event.key === 'Backspace' || event.key === 'Delete') && props.showClear && hasValue.value) {
            event.preventDefault();
            clear(event);
        }
        return;
    }
    if (event.key === 'Tab') {
        hide(false);
        return;
    }
    const rtl = getComputedStyle(event.currentTarget as Element).direction === 'rtl';
    const result = menuKeyAction(props.options, nav.value, event.key, access, { rtl, loop: false });
    switch (result.type) {
        case 'move':
            event.preventDefault();
            // Escape inside a column goes back a column; only at the top does it reach the popup's layer.
            if (event.key === 'Escape') event.stopPropagation();
            moveTo(result.state, event);
            break;
        case 'activate':
            event.preventDefault();
            choose(result.state.path, event);
            break;
    }
}

function onTriggerKeyup(event: KeyboardEvent) {
    if (event.key === ' ') event.preventDefault();
}

function onRootClick(event: MouseEvent) {
    if (props.disabled || (event.target as Element).closest('[data-vt-clear]')) return;
    if (open.value) hide();
    else {
        show();
        triggerRef.value?.focus();
    }
}

function onItemClick(path: number[], option: unknown, event: MouseEvent) {
    event.stopPropagation();
    if (isDisabled(option)) return;
    if (isGroup(option)) {
        const shown = isMenuOpen(nav.value, path);
        moveTo({ path, expanded: !shown }, event);
    } else {
        choose(path, event);
    }
}

function onItemHover(path: number[], option: unknown) {
    if (isDisabled(option)) return;
    // Hovering keeps the columns along the way open and opens this item's own.
    nav.value = { path, expanded: isGroup(option) };
}

// ---- rendering ----------------------------------------------------------------
// The levels nest, so this is a render function; every element still gets its `part()`.

const IconComponent = Icon as unknown as import('vue').Component;
// A column is placed beside the option that opened it with position: fixed, so
// the scrolling first column does not clip it and it flips at the window's edge.
const anchored = useAnchored('overlay');
const columnPlacement = { placement: 'right-start' as const, offset: 0, alignFirstItem: true };

function renderList(list: readonly unknown[], trail: number[], level: number): VNode {
    const attrs = level === 1 ? { id: treeId, role: 'tree', 'aria-labelledby': treeLabelledBy.value, 'aria-label': treeLabelledBy.value ? undefined : treeLabel.value } : { role: 'group' };
    return h(
        'ul',
        mergeProps(part(level === 1 ? 'list' : 'sublist'), attrs, level === 1 ? {} : anchored.hooks(columnPlacement)),
        list.map((option, i) => renderItem(option, [...trail, i], level, i, list.length))
    );
}

function renderItem(option: unknown, path: number[], level: number, index: number, count: number): VNode {
    const group = isGroup(option);
    const shown = group && isMenuOpen(nav.value, path);
    const focused = activeId.value === itemId(path);
    const selected = isChosen(option);
    const disabled = isDisabled(option);
    const content: VNodeArrayChildren = slots.option
        ? (slots.option({ option, level, group, selected, focused }) as VNodeArrayChildren)
        : [h('span', part('optionLabel'), labelOf(option))];
    const icon = group ? (slots.optiongroupicon ? (slots.optiongroupicon() as VNodeArrayChildren) : [h(IconComponent, mergeProps(part('groupIcon'), { icon: 'chevronRight' }))]) : [];
    return h(
        'li',
        mergeProps(part('item'), {
            key: index,
            id: itemId(path),
            role: 'treeitem',
            'aria-level': level,
            'aria-setsize': count,
            'aria-posinset': index + 1,
            'aria-expanded': group ? (shown ? 'true' : 'false') : undefined,
            'aria-selected': group ? undefined : selected ? 'true' : 'false',
            'aria-disabled': disabled ? 'true' : undefined,
            'aria-labelledby': `${itemId(path)}-label`
        }),
        [
            h(
                'div',
                mergeProps(part('option', { selected, focused, disabled, group }), {
                    id: `${itemId(path)}-label`,
                    onClick: (event: MouseEvent) => onItemClick(path, option, event),
                    onMouseenter: () => onItemHover(path, option)
                }),
                [...content, ...icon]
            ),
            shown ? renderList(childrenOf(option) ?? [], path, level + 1) : null
        ]
    );
}

const Levels: FunctionalComponent = () => renderList(props.options, [], 1);

defineExpose({ show, hide, focus: () => triggerRef.value?.focus() });
</script>

<template>
    <div ref="rootRef" v-bind="mergeProps(rootAttrs, part('root', state))" @click="onRootClick">
        <button
            ref="triggerRef"
            type="button"
            role="combobox"
            v-bind="mergeProps(controlAttrs, part('label'))"
            :disabled="disabled"
            aria-haspopup="tree"
            :aria-expanded="open ? 'true' : 'false'"
            :aria-controls="open && options.length ? treeId : undefined"
            :aria-activedescendant="activeId"
            :aria-invalid="invalid ? 'true' : undefined"
            :aria-busy="loading ? 'true' : undefined"
            @keydown="onTriggerKeydown"
            @keyup="onTriggerKeyup"
            @focus="emit('focus', $event)"
            @blur="emit('blur', $event)"
        >
            <slot name="value" :value="model" :option="chosenOption" :placeholder="placeholder">{{ hasValue ? labelOf(chosenOption) : placeholder || ' ' }}</slot>
        </button>
        <button v-if="showClear && hasValue && !disabled" type="button" tabindex="-1" data-vt-clear :aria-label="locale.clear" v-bind="part('clear')" @click="clear">
            <Icon icon="x" />
        </button>
        <span v-bind="part('dropdown')" aria-hidden="true">
            <slot name="dropdownicon" :open="open">
                <Icon :icon="loading ? 'spinner' : 'chevronDown'" :spin="loading" />
            </slot>
        </span>
    </div>
    <Teleport :to="overlayTarget" :disabled="appendTo === 'self'">
        <Transition name="vt-overlay">
            <div v-if="open" ref="overlayRef" v-bind="part('overlay')" @mousedown.prevent>
                <Levels v-if="options.length" />
                <div v-else role="status" v-bind="part('empty')">
                    <slot name="empty">{{ emptyMessage ?? locale.emptyMessage }}</slot>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>
