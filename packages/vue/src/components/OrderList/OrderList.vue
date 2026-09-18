<script setup lang="ts">
import { equals, formatMessage, getField, moveItem, moveItems, type ReorderDirection } from '@vitral/core';
import { orderlistStyle } from '@vitral/styles';
import { computed, nextTick, ref, useAttrs, useId } from 'vue';
import { useComponent } from '../../base/useComponent';
import Button from '../Button/Button.vue';
import type { OrderListEmits, OrderListProps, OrderListSlots } from './types';
import ReorderList from './ReorderList.vue';

// A list the reader puts in order: a multi-selectable listbox, the four move
// buttons beside it, Alt with the arrows (or Home/End) from the keyboard, and
// drag and drop for a pointer. Each move is announced in a polite live region
// — which item went where — so the order is never changed silently. The
// arithmetic is core's.

defineOptions({ name: 'VtOrderList', inheritAttrs: false });

const props = withDefaults(defineProps<OrderListProps>(), { unstyled: undefined, dragdrop: true, showControls: true });
const model = defineModel<unknown[]>({ default: () => [] });
const selection = defineModel<unknown[]>('selection', { default: () => [] });
const emit = defineEmits<OrderListEmits>();
const slots = defineSlots<OrderListSlots>();
const attrs = useAttrs();

const { part, locale } = useComponent(orderlistStyle, props);
const id = useId();
const listId = `${id}-list`;
const headerId = `${id}-header`;
const helpId = `${id}-help`;
const listRef = ref<InstanceType<typeof ReorderList> | null>(null);
const announcement = ref('');

const items = computed(() => model.value ?? []);
const labelOf = (item: unknown) => String((props.optionLabel ? getField(item, props.optionLabel) : item) ?? '');
const selectedIndices = () => {
    const chosen = items.value.map((item, i) => (selection.value.some((s) => equals(s, item, props.dataKey)) ? i : -1)).filter((i) => i >= 0);
    const focused = listRef.value?.focusedIndex ?? -1;
    return chosen.length || focused < 0 ? chosen : [focused];
};
const hasSelection = computed(() => selection.value.length > 0);
const labelledby = computed(() => (attrs['aria-labelledby'] as string | undefined) ?? (props.header || slots.header ? headerId : undefined));

function announce(moved: unknown[], position: number) {
    const count = items.value.length;
    // Clearing first makes a repeated message be read again.
    announcement.value = '';
    nextTick(() => {
        announcement.value =
            moved.length === 1
                ? formatMessage(locale.value.aria.itemMoved, { item: labelOf(moved[0]), position: position + 1, count })
                : formatMessage(locale.value.aria.itemsMoved, { moved: moved.length, position: position + 1, count });
    });
}

function reorder(direction: ReorderDirection, event?: Event, only?: number) {
    if (props.disabled) return;
    const indices = only === undefined ? selectedIndices() : [only];
    if (!indices.length) return;
    const result = moveItems(items.value, indices, direction);
    if (result.list.every((item, i) => item === items.value[i])) return;
    const moved = result.indices.map((i) => result.list[i]);
    model.value = result.list;
    if (!hasSelection.value || only !== undefined) selection.value = moved;
    emit('reorder', { originalEvent: event, value: result.list, direction });
    announce(moved, result.indices[0]!);
    listRef.value?.focusAt(result.indices[0]!);
}

function onDrop(from: number, to: number) {
    const list = moveItem(items.value, from, to);
    model.value = list;
    emit('reorder', { value: list, direction: 'drop' });
    announce([list[to]], to);
}

const buttons = computed(() => [
    { direction: 'top' as const, icon: 'chevronsUp', label: locale.value.aria.moveTop },
    { direction: 'up' as const, icon: 'chevronUp', label: locale.value.aria.moveUp },
    { direction: 'down' as const, icon: 'chevronDown', label: locale.value.aria.moveDown },
    { direction: 'bottom' as const, icon: 'chevronsDown', label: locale.value.aria.moveBottom }
]);
</script>

<template>
    <div :class="attrs.class" :style="attrs.style as never" v-bind="part('root')">
        <div v-if="showControls" v-bind="part('controls')">
            <Button
                v-for="b in buttons"
                :key="b.direction"
                :icon="b.icon"
                :aria-label="b.label"
                :aria-controls="listId"
                :disabled="disabled || !hasSelection"
                severity="secondary"
                :unstyled="unstyled"
                @click="reorder(b.direction, $event)"
            />
        </div>
        <div v-bind="part('panel', { disabled })">
            <div v-if="header || $slots.header" :id="headerId" v-bind="part('header')">
                <slot name="header">{{ header }}</slot>
            </div>
            <ReorderList
                ref="listRef"
                v-model:selection="selection"
                :items="items"
                :part="part"
                :list-id="listId"
                :data-key="dataKey"
                :option-label="optionLabel"
                :disabled="disabled"
                :draggable="dragdrop"
                :label="attrs['aria-label'] as string | undefined"
                :labelledby="labelledby"
                :describedby="helpId"
                :locale="locale.code"
                :style="scrollHeight ? { height: scrollHeight } : undefined"
                @reorder="(direction, only) => reorder(direction, undefined, only)"
                @drop="onDrop"
            >
                <template v-if="slots.option" #option="p"><slot name="option" v-bind="p" /></template>
            </ReorderList>
            <span :id="helpId" hidden>{{ locale.aria.reorderInstructions }}</span>
            <span role="status" aria-live="polite" v-bind="part('status')">{{ announcement }}</span>
        </div>
    </div>
</template>
