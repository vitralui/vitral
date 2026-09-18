<script setup lang="ts">
import { equals, firstIndex, getField, indexRange, isPrintableKey, lastIndex, createTypeahead, typeaheadIndex, type ReorderDirection } from '@vitral/core';
import { computed, mergeProps, nextTick, ref } from 'vue';
import type { PassThroughAttrs } from '../../base/types';

// The multi-selectable WAI-ARIA listbox inside OrderList and PickList. Focus
// stays on the list and the active option is conveyed by
// aria-activedescendant. Up/Down/Home/End move; Space toggles; Shift with the
// arrows extends the selection; Ctrl+A selects all; Alt with the arrows,
// Home or End asks the parent to move the selection (`reorder`); Enter and a
// double click ask it to act on the selection — or, with none, on the active
// option (`activate`). An option can be dragged to a new place (`drop`).

defineOptions({ name: 'VtReorderList' });

const props = defineProps<{
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: any[];
    selection: unknown[];
    part: (name: string, state?: unknown) => PassThroughAttrs;
    listId: string;
    dataKey?: string;
    optionLabel?: string;
    disabled?: boolean;
    draggable?: boolean;
    label?: string;
    labelledby?: string;
    describedby?: string;
    locale?: string;
}>();
const emit = defineEmits<{
    'update:selection': [value: unknown[]];
    /** `only` is set when the keyboard moved an unselected item: move that one, whatever the parent's selection still says. */
    reorder: [direction: ReorderDirection, only?: number];
    activate: [event: Event];
    drop: [from: number, to: number];
}>();
defineSlots<{ option?: (props: { item: unknown; index: number; selected: boolean }) => unknown }>();

const listRef = ref<HTMLElement | null>(null);
const focusedIndex = ref(-1);
const anchor = ref(-1);
const hasFocus = ref(false);
const dropAt = ref<{ index: number; side: 'before' | 'after' } | null>(null);
const typeahead = createTypeahead();
let dragFrom = -1;

const optionId = (index: number) => `${props.listId}-option-${index}`;
const labelOf = (item: unknown) => String((props.optionLabel ? getField(item, props.optionLabel) : item) ?? '');
const isChosen = (item: unknown) => props.selection.some((s) => equals(s, item, props.dataKey));
const activeId = computed(() => (hasFocus.value && focusedIndex.value >= 0 && focusedIndex.value < props.items.length ? optionId(focusedIndex.value) : undefined));
const never = () => false;

function scrollTo(index: number) {
    nextTick(() => document.getElementById(optionId(index))?.scrollIntoView?.({ block: 'nearest' }));
}

function moveTo(index: number) {
    if (index < 0) return;
    focusedIndex.value = index;
    scrollTo(index);
}

/** Puts focus on `index`, for after the parent moved the items. */
function focusAt(index: number) {
    focusedIndex.value = Math.min(index, props.items.length - 1);
    listRef.value?.focus();
    scrollTo(focusedIndex.value);
}

function setSelection(value: unknown[]) {
    emit('update:selection', value);
}

function toggle(index: number) {
    const item = props.items[index];
    if (item === undefined) return;
    anchor.value = index;
    setSelection(isChosen(item) ? props.selection.filter((s) => !equals(s, item, props.dataKey)) : [...props.selection, item]);
}

function selectRange(from: number, to: number) {
    const picked = indexRange(from, to).map((i) => props.items[i]);
    setSelection([...props.selection.filter((s) => !picked.some((p) => equals(p, s, props.dataKey))), ...picked]);
}

function onFocus() {
    hasFocus.value = true;
    if (focusedIndex.value < 0 || focusedIndex.value >= props.items.length) {
        const chosen = props.items.findIndex(isChosen);
        focusedIndex.value = chosen >= 0 ? chosen : firstIndex(props.items.length, never);
    }
}

function onKeydown(event: KeyboardEvent) {
    if (props.disabled) return;
    const count = props.items.length;
    const from = focusedIndex.value;
    if (event.altKey && ['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        const current = props.items[from];
        const direction = ({ ArrowUp: 'up', ArrowDown: 'down', Home: 'top', End: 'bottom' } as const)[event.key as 'Home'];
        // The selection update reaches the parent after this event, so name the item outright.
        if (current !== undefined && !isChosen(current)) emit('reorder', direction, from);
        else emit('reorder', direction);
        return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
        event.preventDefault();
        setSelection(props.selection.length === count ? [] : [...props.items]);
        return;
    }
    switch (event.key) {
        case 'ArrowDown':
        case 'ArrowUp': {
            event.preventDefault();
            const to = from < 0 ? 0 : Math.max(0, Math.min(count - 1, from + (event.key === 'ArrowDown' ? 1 : -1)));
            moveTo(to);
            if (event.shiftKey && to !== from) {
                const item = props.items[to];
                if (item !== undefined && !isChosen(item)) setSelection([...props.selection, item]);
            }
            return;
        }
        case 'Home':
        case 'End': {
            event.preventDefault();
            const to = event.key === 'Home' ? firstIndex(count, never) : lastIndex(count, never);
            if (event.shiftKey && (event.ctrlKey || event.metaKey) && from >= 0) selectRange(from, to);
            moveTo(to);
            return;
        }
        case ' ':
            event.preventDefault();
            if (event.shiftKey && anchor.value >= 0 && from >= 0) selectRange(anchor.value, from);
            else toggle(from);
            return;
        case 'Enter':
            event.preventDefault();
            emit('activate', event);
            return;
    }
    if (isPrintableKey(event)) {
        const index = typeaheadIndex(props.items.map(labelOf), typeahead.push(event.key), from, never, props.locale);
        if (index >= 0) {
            event.preventDefault();
            moveTo(index);
        }
    }
}

function onClick(index: number, event: MouseEvent) {
    if (props.disabled) return;
    focusedIndex.value = index;
    const item = props.items[index];
    if (event.shiftKey && anchor.value >= 0) selectRange(anchor.value, index);
    else if (event.ctrlKey || event.metaKey) toggle(index);
    else {
        anchor.value = index;
        setSelection(isChosen(item) && props.selection.length === 1 ? [] : [item]);
    }
}

function onDblclick(index: number, event: MouseEvent) {
    if (props.disabled) return;
    focusedIndex.value = index;
    setSelection([props.items[index]]);
    emit('activate', event);
}

// ---- dragging --------------------------------------------------------------------

function onDragstart(index: number, event: DragEvent) {
    dragFrom = index;
    event.dataTransfer?.setData('text/plain', labelOf(props.items[index]));
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
}

function onDragover(index: number, event: DragEvent) {
    if (dragFrom < 0) return;
    event.preventDefault();
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    dropAt.value = { index, side: event.clientY < rect.top + rect.height / 2 ? 'before' : 'after' };
}

function onDrop(event: DragEvent) {
    event.preventDefault();
    const target = dropAt.value;
    if (dragFrom >= 0 && target) {
        let to = target.side === 'before' ? target.index : target.index + 1;
        if (dragFrom < to) to--;
        if (to !== dragFrom) emit('drop', dragFrom, to);
    }
    onDragend();
}

function onDragend() {
    dragFrom = -1;
    dropAt.value = null;
}

defineExpose({ focusAt, focusedIndex });
</script>

<template>
    <ul
        :id="listId"
        ref="listRef"
        role="listbox"
        aria-multiselectable="true"
        :tabindex="disabled ? -1 : 0"
        :aria-label="labelledby ? undefined : label"
        :aria-labelledby="labelledby"
        :aria-describedby="describedby"
        :aria-activedescendant="activeId"
        :aria-disabled="disabled ? 'true' : undefined"
        v-bind="part('list')"
        @focus="onFocus"
        @blur="hasFocus = false"
        @keydown="onKeydown"
        @dragleave.self="dropAt = null"
    >
        <li
            v-for="(item, index) in items"
            :id="optionId(index)"
            :key="dataKey ? String(getField(item, dataKey)) : index"
            role="option"
            :aria-selected="isChosen(item) ? 'true' : 'false'"
            :draggable="draggable && !disabled ? 'true' : undefined"
            v-bind="mergeProps(part('option', { selected: isChosen(item), focused: hasFocus && focusedIndex === index, disabled, drop: dropAt?.index === index ? dropAt.side : null }))"
            @click="onClick(index, $event)"
            @dblclick="onDblclick(index, $event)"
            @dragstart="onDragstart(index, $event)"
            @dragover="onDragover(index, $event)"
            @drop="onDrop"
            @dragend="onDragend"
        >
            <slot name="option" :item="item" :index="index" :selected="isChosen(item)">{{ labelOf(item) }}</slot>
        </li>
    </ul>
</template>
