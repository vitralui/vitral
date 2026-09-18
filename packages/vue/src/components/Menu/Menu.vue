<script setup lang="ts">
import { createTypeahead, isPrintableKey, rovingIndex, rovingMove, typeaheadIndex } from '@vitral/core';
import { menuStyle } from '@vitral/styles';
import { computed, mergeProps, nextTick, ref, useAttrs, useId } from 'vue';
import { useComponent } from '../../base/useComponent';
import { useOverlay } from '../../composables/useOverlay';
import Icon from '../Icon/Icon.vue';
import type { MenuEmits, MenuItem, MenuProps, MenuSlots } from './types';
import { useOverlayTarget } from '../../composables/useOverlayTarget';

// The WAI-ARIA menu pattern. Every item is a menuitem with a roving tabindex,
// so focus itself moves: arrows (wrapping), Home/End, typeahead, Enter/Space
// to activate. Groups are role="group" labelled by their heading. In popup
// mode focus goes to the first item on open; Escape, Tab and activation close
// the menu and hand focus back to the element that opened it.

defineOptions({ name: 'VtMenu', inheritAttrs: false });

const props = withDefaults(defineProps<MenuProps>(), { unstyled: undefined, model: () => [], appendTo: 'body', placement: 'bottom-start' });
const overlayTarget = useOverlayTarget(() => props.appendTo);
const emit = defineEmits<MenuEmits>();
defineSlots<MenuSlots>();

const { part, locale } = useComponent(menuStyle, props);
const attrs = useAttrs();
const autoId = useId();
// An `id` names the menu itself, which is what a trigger's aria-controls points at.
const menuId = computed(() => (attrs.id as string | undefined) ?? `${autoId}-menu`);
const rootAttrs = computed(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, ...rest } = attrs;
    return rest;
});

interface ItemEntry {
    kind: 'item';
    key: string;
    item: MenuItem;
    index: number;
}

interface SeparatorEntry {
    kind: 'separator';
    key: string;
}

interface GroupEntry {
    kind: 'group';
    key: string;
    item: MenuItem;
    labelId: string;
    children: (ItemEntry | SeparatorEntry)[];
}

type Entry = ItemEntry | SeparatorEntry | GroupEntry;

const shown = (item: MenuItem) => item.visible !== false;

/** The model as rendered, with every item numbered in reading order across groups. */
const entries = computed<Entry[]>(() => {
    let index = 0;
    const leaf = (item: MenuItem, key: string): ItemEntry | SeparatorEntry =>
        item.separator ? { kind: 'separator', key } : { kind: 'item', key, item, index: index++ };
    return props.model.filter(shown).map((item, i): Entry => {
        const key = item.key ?? String(i);
        if (!item.separator && item.items) {
            return { kind: 'group', key, item, labelId: `${autoId}-group-${i}`, children: item.items.filter(shown).map((child, j) => leaf(child, child.key ?? `${key}-${j}`)) };
        }
        return leaf(item, key);
    });
});

const items = computed(() => entries.value.flatMap((entry) => (entry.kind === 'group' ? entry.children : [entry])).filter((entry): entry is ItemEntry => entry.kind === 'item'));

const open = ref(false);
const rendered = computed(() => !props.popup || open.value);
const focusedIndex = ref(-1);
const hasFocus = ref(false);
const target = ref<HTMLElement | null>(null);
const overlayRef = ref<HTMLElement | null>(null);
const labelFromTarget = ref<string>();
const itemEls: (HTMLElement | null)[] = [];
const typeahead = createTypeahead();

const tabStop = computed(() => (focusedIndex.value >= 0 && focusedIndex.value < items.value.length ? focusedIndex.value : 0));
const labelledBy = computed(() => props.ariaLabelledby ?? (props.ariaLabel ? undefined : labelFromTarget.value));

function setRoot(el: unknown) {
    overlayRef.value = props.popup ? (el as HTMLElement | null) : null;
}

const itemRef = (index: number) => (el: unknown) => {
    itemEls[index] = el as HTMLElement | null;
};

useOverlay({
    anchor: () => target.value,
    overlay: overlayRef,
    placement: () => props.placement,
    zIndexKey: 'menu',
    onEscape: () => hide(true),
    onPointerDownOutside: () => hide(false)
});

function focusItem(index: number) {
    if (index < 0) return;
    focusedIndex.value = index;
    itemEls[index]?.focus();
}

function show(event?: Event) {
    const origin = (event?.currentTarget ?? event?.target) as EventTarget | null | undefined;
    if (origin instanceof HTMLElement) target.value = origin;
    if (!props.popup || open.value) return;
    const trigger = target.value;
    if (trigger && !props.ariaLabel && !props.ariaLabelledby) {
        trigger.id ||= `${autoId}-trigger`;
        labelFromTarget.value = trigger.id;
    }
    trigger?.setAttribute('aria-expanded', 'true');
    open.value = true;
    emit('show');
    nextTick(() => focusItem(0));
}

/** Closes a popup menu. Focus goes back to the element that opened it when `returnFocus` is set. */
function hide(returnFocus = false) {
    if (!open.value) return;
    open.value = false;
    focusedIndex.value = -1;
    typeahead.reset();
    target.value?.setAttribute('aria-expanded', 'false');
    emit('hide');
    if (returnFocus) target.value?.focus();
}

function toggle(event?: Event) {
    if (open.value) hide();
    else show(event);
}

function activate(event: Event, entry: ItemEntry) {
    const { item } = entry;
    if (item.disabled) {
        event.preventDefault();
        return;
    }
    focusedIndex.value = entry.index;
    item.command?.({ originalEvent: event, item });
    if (props.popup) hide(true);
}

function onKeydown(event: KeyboardEvent) {
    const count = items.value.length;
    if (count === 0) return;
    const current = focusedIndex.value;
    const move = rovingMove(event.key, { orientation: 'vertical' });
    if (move) {
        event.preventDefault();
        focusItem(rovingIndex(move, count, current));
        return;
    }
    switch (event.key) {
        case 'Enter':
        case ' ':
            // One path for every item: a link follows its href on click, a command runs on click.
            event.preventDefault();
            if (current >= 0) itemEls[current]?.click();
            break;
        case 'Tab':
            // Focus goes back to the trigger first, so the Tab itself moves on from there.
            if (props.popup) hide(true);
            break;
        default:
            if (isPrintableKey(event)) {
                event.preventDefault();
                const labels = items.value.map((entry) => entry.item.label ?? '');
                focusItem(typeaheadIndex(labels, typeahead.push(event.key), current, undefined, locale.value.code));
            }
    }
}

function onFocusin(event: FocusEvent) {
    hasFocus.value = true;
    const index = itemEls.indexOf(event.target as HTMLElement);
    if (index >= 0) focusedIndex.value = index;
}

function onFocusout(event: FocusEvent) {
    const next = event.relatedTarget as Node | null;
    if (!next || !(event.currentTarget as HTMLElement).contains(next)) hasFocus.value = false;
}

const itemState = (entry: ItemEntry) => ({ disabled: !!entry.item.disabled, focused: hasFocus.value && focusedIndex.value === entry.index });

function itemAttrs(entry: ItemEntry) {
    const { item } = entry;
    const link = !!item.url;
    return mergeProps(part('itemContent', itemState(entry)), {
        role: 'menuitem',
        tabindex: tabStop.value === entry.index ? 0 : -1,
        'aria-disabled': item.disabled ? 'true' : undefined,
        href: link && !item.disabled ? item.url : undefined,
        target: link ? item.target : undefined
    });
}

defineExpose({ toggle, show, hide });
</script>

<template>
    <Teleport :to="overlayTarget" :disabled="!popup || appendTo === 'self'">
        <Transition name="vt-overlay">
            <div v-if="rendered" :ref="setRoot" v-bind="mergeProps(rootAttrs, part('root', { popup }))">
                <div v-if="$slots.start" v-bind="part('start')">
                    <slot name="start" />
                </div>
                <ul :id="menuId" role="menu" :aria-label="ariaLabel" :aria-labelledby="labelledBy" v-bind="part('list')" @keydown="onKeydown" @focusin="onFocusin" @focusout="onFocusout">
                    <template v-for="entry in entries" :key="entry.key">
                        <li v-if="entry.kind === 'separator'" role="separator" v-bind="part('separator')" />
                        <li v-else-if="entry.kind === 'group'" role="none" v-bind="part('group')">
                            <ul role="group" :aria-labelledby="entry.labelId" v-bind="part('groupList')">
                                <li :id="entry.labelId" role="presentation" v-bind="part('submenuLabel')">
                                    <slot name="submenulabel" :item="entry.item">{{ entry.item.label }}</slot>
                                </li>
                                <template v-for="child in entry.children" :key="child.key">
                                    <li v-if="child.kind === 'separator'" role="separator" v-bind="part('separator')" />
                                    <li v-else role="none" v-bind="mergeProps(part('item', itemState(child)), { class: child.item.class })">
                                        <component :is="child.item.url ? 'a' : 'div'" :ref="itemRef(child.index)" v-bind="itemAttrs(child)" @click="activate($event, child)">
                                            <slot name="item" :item="child.item" :label="child.item.label" :focused="itemState(child).focused" :disabled="!!child.item.disabled">
                                                <Icon v-if="child.item.icon" :icon="child.item.icon" v-bind="part('itemIcon')" />
                                                <span v-bind="part('itemLabel')">{{ child.item.label }}</span>
                                            </slot>
                                        </component>
                                    </li>
                                </template>
                            </ul>
                        </li>
                        <li v-else role="none" v-bind="mergeProps(part('item', itemState(entry)), { class: entry.item.class })">
                            <component :is="entry.item.url ? 'a' : 'div'" :ref="itemRef(entry.index)" v-bind="itemAttrs(entry)" @click="activate($event, entry)">
                                <slot name="item" :item="entry.item" :label="entry.item.label" :focused="itemState(entry).focused" :disabled="!!entry.item.disabled">
                                    <Icon v-if="entry.item.icon" :icon="entry.item.icon" v-bind="part('itemIcon')" />
                                    <span v-bind="part('itemLabel')">{{ entry.item.label }}</span>
                                </slot>
                            </component>
                        </li>
                    </template>
                </ul>
                <div v-if="$slots.end" v-bind="part('end')">
                    <slot name="end" />
                </div>
            </div>
        </Transition>
    </Teleport>
</template>
