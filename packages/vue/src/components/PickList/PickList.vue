<script setup lang="ts">
import { equals, formatMessage, getField, moveItem, moveItems, transferItems, type ReorderDirection } from '@vitral/core';
import { picklistStyle } from '@vitral/styles';
import { computed, nextTick, ref, useId } from 'vue';
import { useComponent } from '../../base/useComponent';
import Button from '../Button/Button.vue';
import ReorderList from '../OrderList/ReorderList.vue';
import type { PickListEmits, PickListProps, PickListSlots } from './types';

// Two multi-selectable listboxes, each named by its header, and the moves
// between them: the four transfer buttons, Enter or a double click on a list
// (which sends its selection, or its active item, across), and Alt with the
// arrows to reorder within a list. Every move is announced in a polite live
// region. `v-model` is `[source, target]`.

defineOptions({ name: 'VtPickList' });

const props = withDefaults(defineProps<PickListProps>(), { unstyled: undefined, showSourceControls: true, showTargetControls: true });
const model = defineModel<[unknown[], unknown[]]>({ default: () => [[], []] });
const selection = defineModel<[unknown[], unknown[]]>('selection', { default: () => [[], []] });
const emit = defineEmits<PickListEmits>();
const slots = defineSlots<PickListSlots>();

const { part, locale } = useComponent(picklistStyle, props);
const id = useId();
const ids = { source: `${id}-source`, target: `${id}-target` };
const sourceRef = ref<InstanceType<typeof ReorderList> | null>(null);
const targetRef = ref<InstanceType<typeof ReorderList> | null>(null);
const announcement = ref('');

type Side = 'source' | 'target';
const at = (side: Side) => (side === 'source' ? 0 : 1);
const listOf = (side: Side) => model.value?.[at(side)] ?? [];
const selectionOf = (side: Side) => selection.value?.[at(side)] ?? [];
// Function refs: string refs inside v-for would collect arrays.
function setListRef(side: Side, el: unknown) {
    (side === 'source' ? sourceRef : targetRef).value = el as InstanceType<typeof ReorderList> | null;
}
const refOf = (side: Side) => (side === 'source' ? sourceRef : targetRef).value;
const labelOf = (item: unknown) => String((props.optionLabel ? getField(item, props.optionLabel) : item) ?? '');
const nameOf = (side: Side) => (side === 'source' ? (props.sourceHeader ?? locale.value.aria.sourceList) : (props.targetHeader ?? locale.value.aria.targetList));

function setList(side: Side, value: unknown[]) {
    const next: [unknown[], unknown[]] = [listOf('source'), listOf('target')];
    next[at(side)] = value;
    model.value = next;
}

function setSelection(side: Side, value: unknown[]) {
    const next: [unknown[], unknown[]] = [selectionOf('source'), selectionOf('target')];
    next[at(side)] = value;
    selection.value = next;
}

function indicesOf(side: Side): number[] {
    const list = listOf(side);
    const chosen = list.map((item, i) => (selectionOf(side).some((s) => equals(s, item, props.dataKey)) ? i : -1)).filter((i) => i >= 0);
    const focused = refOf(side)?.focusedIndex ?? -1;
    return chosen.length || focused < 0 || focused >= list.length ? chosen : [focused];
}

function say(message: string) {
    announcement.value = '';
    nextTick(() => (announcement.value = message));
}

function transfer(from: Side, all = false) {
    if (props.disabled) return;
    const to: Side = from === 'source' ? 'target' : 'source';
    const indices = all ? listOf(from).map((_, i) => i) : indicesOf(from);
    if (!indices.length) return;
    const result = transferItems(listOf(from), listOf(to), indices);
    const moved = result.indices.map((i) => result.target[i]);
    const next: [unknown[], unknown[]] = from === 'source' ? [result.source, result.target] : [result.target, result.source];
    model.value = next;
    const nextSelection: [unknown[], unknown[]] = [[], []];
    nextSelection[at(to)] = moved;
    selection.value = nextSelection;
    const event = { items: moved };
    if (from === 'source' && all) emit('move-all-to-target', event);
    else if (from === 'source') emit('move-to-target', event);
    else if (all) emit('move-all-to-source', event);
    else emit('move-to-source', event);
    say(formatMessage(locale.value.aria.itemsTransferred, { moved: moved.length === 1 ? labelOf(moved[0]) : moved.length, list: nameOf(to) }));
}

function reorder(side: Side, direction: ReorderDirection, only?: number) {
    if (props.disabled) return;
    const indices = only === undefined ? indicesOf(side) : [only];
    if (!indices.length) return;
    const result = moveItems(listOf(side), indices, direction);
    if (result.list.every((item, i) => item === listOf(side)[i])) return;
    const moved = result.indices.map((i) => result.list[i]);
    setList(side, result.list);
    if (!selectionOf(side).length || only !== undefined) setSelection(side, moved);
    emit('reorder', { list: side, value: result.list });
    const count = result.list.length;
    const position = result.indices[0]! + 1;
    say(
        moved.length === 1
            ? formatMessage(locale.value.aria.itemMoved, { item: labelOf(moved[0]), position, count })
            : formatMessage(locale.value.aria.itemsMoved, { moved: moved.length, position, count })
    );
    refOf(side)?.focusAt(result.indices[0]!);
}

function onDrop(side: Side, from: number, to: number) {
    const list = moveItem(listOf(side), from, to);
    setList(side, list);
    emit('reorder', { list: side, value: list });
    say(formatMessage(locale.value.aria.itemMoved, { item: labelOf(list[to]), position: to + 1, count: list.length }));
}

const reorderButtons = computed(() => [
    { direction: 'top' as const, icon: 'chevronsUp', label: locale.value.aria.moveTop },
    { direction: 'up' as const, icon: 'chevronUp', label: locale.value.aria.moveUp },
    { direction: 'down' as const, icon: 'chevronDown', label: locale.value.aria.moveDown },
    { direction: 'bottom' as const, icon: 'chevronsDown', label: locale.value.aria.moveBottom }
]);
const sides: Side[] = ['source', 'target'];
</script>

<template>
    <div v-bind="part('root')">
        <template v-for="side in sides" :key="side">
            <div v-if="side === 'source' ? showSourceControls : false" v-bind="part('controls')">
                <Button
                    v-for="b in reorderButtons"
                    :key="b.direction"
                    :icon="b.icon"
                    :aria-label="`${b.label} (${nameOf(side)})`"
                    :aria-controls="ids[side]"
                    :disabled="disabled || !selectionOf(side).length"
                    severity="secondary"
                    :unstyled="unstyled"
                    @click="reorder(side, b.direction)"
                />
            </div>
            <div v-bind="part('panel', { disabled })">
                <div :id="`${ids[side]}-header`" v-bind="part('header')">
                    <slot :name="side === 'source' ? 'sourceheader' : 'targetheader'">{{ nameOf(side) }}</slot>
                </div>
                <ReorderList
                    :ref="(el: unknown) => setListRef(side, el)"
                    :selection="selectionOf(side)"
                    :items="listOf(side)"
                    :part="part"
                    :list-id="ids[side]"
                    :data-key="dataKey"
                    :option-label="optionLabel"
                    :disabled="disabled"
                    draggable
                    :labelledby="`${ids[side]}-header`"
                    :describedby="`${id}-help`"
                    :locale="locale.code"
                    :style="scrollHeight ? { height: scrollHeight } : undefined"
                    @update:selection="setSelection(side, $event)"
                    @reorder="(direction, only) => reorder(side, direction, only)"
                    @activate="transfer(side)"
                    @drop="(from: number, to: number) => onDrop(side, from, to)"
                >
                    <template v-if="slots.option" #option="p"><slot name="option" v-bind="p" :list="side" /></template>
                </ReorderList>
            </div>
            <div v-if="side === 'source'" v-bind="part('transfer')">
                <Button icon="chevronRight" :aria-label="locale.aria.moveToTarget" :aria-controls="ids.target" :disabled="disabled || !selectionOf('source').length" severity="secondary" :unstyled="unstyled" @click="transfer('source')" />
                <Button icon="chevronsRight" :aria-label="locale.aria.moveAllToTarget" :aria-controls="ids.target" :disabled="disabled || !listOf('source').length" severity="secondary" :unstyled="unstyled" @click="transfer('source', true)" />
                <Button icon="chevronLeft" :aria-label="locale.aria.moveToSource" :aria-controls="ids.source" :disabled="disabled || !selectionOf('target').length" severity="secondary" :unstyled="unstyled" @click="transfer('target')" />
                <Button icon="chevronsLeft" :aria-label="locale.aria.moveAllToSource" :aria-controls="ids.source" :disabled="disabled || !listOf('target').length" severity="secondary" :unstyled="unstyled" @click="transfer('target', true)" />
            </div>
            <div v-if="side === 'target' ? showTargetControls : false" v-bind="part('controls')">
                <Button
                    v-for="b in reorderButtons"
                    :key="b.direction"
                    :icon="b.icon"
                    :aria-label="`${b.label} (${nameOf(side)})`"
                    :aria-controls="ids[side]"
                    :disabled="disabled || !selectionOf(side).length"
                    severity="secondary"
                    :unstyled="unstyled"
                    @click="reorder(side, b.direction)"
                />
            </div>
        </template>
        <span :id="`${id}-help`" hidden>{{ locale.aria.reorderInstructions }}</span>
        <span role="status" aria-live="polite" v-bind="part('status')">{{ announcement }}</span>
    </div>
</template>
