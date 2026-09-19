<script setup lang="ts">
import {
    createTypeahead,
    equals,
    FilterService,
    firstIndex,
    flattenOptions,
    formatMessage,
    getField,
    groupOptions,
    isPrintableKey,
    lastIndex,
    optionLabel,
    optionValue,
    selectRows,
    stepIndex,
    typeaheadIndex,
    type OptionItem
} from '@vitral/core';
import { multiselectStyle } from '@vitral/styles';
import { computed, mergeProps, nextTick, ref, useId } from 'vue';
import { useComponent, useSplitAttrs } from '../../base/useComponent';
import { useOverlay } from '../../composables/useOverlay';
import Chip from '../Chip/Chip.vue';
import Icon from '../Icon/Icon.vue';
import type { MultiSelectEmits, MultiSelectProps, MultiSelectSlots } from './types';
import { useOverlayTarget } from '../../composables/useOverlayTarget';
import { keepFocus } from '../../base/press';

// Select's select-only combobox over a multi-selectable listbox. Focus stays
// on the combobox (or on the search box, when there is one) and the active
// option is conveyed by aria-activedescendant. Enter and Space toggle the
// active option and keep the list open; Ctrl+A toggles every option, which is
// also what the header box does for a pointer. Tab and Escape close.

defineOptions({ name: 'VtMultiSelect', inheritAttrs: false });

const props = withDefaults(defineProps<MultiSelectProps>(), {
    unstyled: undefined,
    variant: undefined,
    options: () => [],
    optionGroupChildren: 'items',
    display: 'comma',
    showToggleAll: true,
    filterMatchMode: 'contains',
    placement: 'bottom-start',
    appendTo: 'body'
});
const overlayTarget = useOverlayTarget(() => props.appendTo);
const model = defineModel<unknown[] | null>();
const emit = defineEmits<MultiSelectEmits>();
defineSlots<MultiSelectSlots>();

const { part, config, locale } = useComponent(multiselectStyle, props);
const { rootAttrs, controlAttrs } = useSplitAttrs();

const id = useId();
const listId = `${id}-list`;
const optionId = (index: number) => `${id}-option-${index}`;

const rootRef = ref<HTMLElement | null>(null);
const triggerRef = ref<HTMLButtonElement | null>(null);
const overlayRef = ref<HTMLElement | null>(null);
const filterRef = ref<HTMLInputElement | null>(null);

const open = ref(false);
const query = ref('');
const focusedIndex = ref(-1);
const labelFromFor = ref<string>();
const typeahead = createTypeahead();

const fields = computed(() => ({
    optionLabel: props.optionLabel,
    optionValue: props.optionValue,
    optionDisabled: props.optionDisabled,
    optionGroupLabel: props.optionGroupLabel,
    optionGroupChildren: props.optionGroupChildren
}));
const labelOf = (option: unknown) => optionLabel(option, fields.value);
const valueOf = (option: unknown) => optionValue(option, fields.value);

const matches = (option: unknown): boolean => {
    const q = query.value;
    if (!props.filter || !q.trim()) return true;
    const code = locale.value.code;
    if (props.filterFields?.length) return props.filterFields.some((field) => FilterService.matches(getField(option, field), q, props.filterMatchMode, code));
    return FilterService.matches(labelOf(option), q, props.filterMatchMode, code);
};

const groups = computed(() => groupOptions(props.options, fields.value, matches));
const items = computed(() => groups.value.flatMap((group) => group.items));
const allOptions = computed(() => flattenOptions(props.options, fields.value));
const compareKey = computed(() => (props.optionValue ? undefined : props.dataKey));
const selected = computed<unknown[]>(() => (Array.isArray(model.value) ? model.value : []));
const isChosen = (value: unknown) => selected.value.some((v) => equals(v, value, compareKey.value));
const selectedOptions = computed(() => selected.value.map((value) => allOptions.value.find((option) => equals(valueOf(option), value, compareKey.value)) ?? value));
const limitReached = computed(() => props.selectionLimit !== undefined && selected.value.length >= props.selectionLimit);
const isDisabledAt = (index: number) => {
    const item = items.value[index];
    return !item || item.disabled;
};
const focusedId = computed(() => (open.value && focusedIndex.value >= 0 && items.value[focusedIndex.value] ? optionId(focusedIndex.value) : undefined));

const enabledVisible = computed(() => items.value.filter((item) => !item.disabled));
const allState = computed<'all' | 'some' | 'none'>(() => {
    const list = enabledVisible.value;
    const count = list.filter((item) => isChosen(item.value)).length;
    return count === 0 ? 'none' : count === list.length ? 'all' : 'some';
});

const hasValue = computed(() => selected.value.length > 0);
const overLimit = computed(() => props.maxSelectedLabels !== undefined && selected.value.length > props.maxSelectedLabels);
const commaText = computed(() => {
    if (!hasValue.value) return props.placeholder || ' ';
    if (overLimit.value) return formatMessage(props.selectedItemsLabel ?? locale.value.selectionMessage, { count: selected.value.length });
    return selectedOptions.value.map(labelOf).join(', ');
});
const showChips = computed(() => props.display === 'chip' && hasValue.value && !overLimit.value);

const state = computed(() => ({
    size: props.size,
    variant: props.variant ?? config.inputVariant,
    invalid: props.invalid,
    disabled: props.disabled,
    fluid: props.fluid,
    focused: open.value,
    open: open.value,
    placeholder: !hasValue.value,
    chips: showChips.value
}));

const emptyText = computed(() => (query.value.trim() ? (props.emptyFilterMessage ?? locale.value.emptySearchMessage) : (props.emptyMessage ?? locale.value.emptyMessage)));
const listboxLabelledBy = computed(() => (controlAttrs.value['aria-labelledby'] as string | undefined) ?? labelFromFor.value);
const listboxLabel = computed(() => (controlAttrs.value['aria-label'] as string | undefined) ?? props.placeholder ?? locale.value.choose);

useOverlay({
    anchor: rootRef,
    overlay: overlayRef,
    matchWidth: true,
    placement: () => props.placement,
    onEscape: () => hide(),
    onPointerDownOutside: () => hide(false)
});

function scrollToFocused() {
    nextTick(() => {
        if (focusedId.value) document.getElementById(focusedId.value)?.scrollIntoView?.({ block: 'nearest' });
    });
}

function moveTo(index: number) {
    if (index < 0) return;
    focusedIndex.value = index;
    scrollToFocused();
}

function show(target: 'selected' | 'first' | 'last' = 'selected') {
    if (props.disabled) return;
    if (!open.value) {
        const label = triggerRef.value?.labels?.[0];
        if (label) {
            label.id ||= `${id}-label`;
            labelFromFor.value = label.id;
        }
        open.value = true;
        emit('show');
        if (props.filter) nextTick(() => filterRef.value?.focus());
    }
    const count = items.value.length;
    if (target === 'last') moveTo(lastIndex(count, isDisabledAt));
    else if (target === 'first') moveTo(firstIndex(count, isDisabledAt));
    else {
        const chosen = items.value.findIndex((item) => isChosen(item.value) && !item.disabled);
        moveTo(chosen >= 0 ? chosen : firstIndex(count, isDisabledAt));
    }
}

function hide(returnFocus = true) {
    if (!open.value) return;
    open.value = false;
    focusedIndex.value = -1;
    typeahead.reset();
    if (props.resetFilterOnHide) query.value = '';
    emit('hide');
    if (returnFocus) triggerRef.value?.focus();
}

function commit(value: unknown[], event?: Event) {
    model.value = value;
    emit('change', { originalEvent: event, value });
}

function toggle(item: OptionItem | undefined, event?: Event) {
    if (!item || item.disabled) return;
    focusedIndex.value = item.index;
    const chosen = isChosen(item.value);
    if (!chosen && limitReached.value) return;
    commit(selectRows(selected.value, [item.value], !chosen, compareKey.value), event);
}

function toggleAll(event: Event) {
    const select = allState.value !== 'all';
    let values = enabledVisible.value.map((item) => item.value);
    if (select && props.selectionLimit !== undefined) {
        const room = Math.max(0, props.selectionLimit - selected.value.length);
        values = values.filter((v) => !isChosen(v)).slice(0, room);
    }
    commit(selectRows(selected.value, values, select, compareKey.value), event);
    emit('selectall-change', { originalEvent: event, checked: select });
}

function clear(event: Event) {
    commit([], event);
    triggerRef.value?.focus();
}

function move(step: 1 | -1) {
    const count = items.value.length;
    if (focusedIndex.value < 0) moveTo(step > 0 ? firstIndex(count, isDisabledAt) : lastIndex(count, isDisabledAt));
    else moveTo(stepIndex(count, focusedIndex.value, step, isDisabledAt));
}

/** The keys the list answers, whether focus is on the combobox or in the search box. */
function listKeys(event: KeyboardEvent): boolean {
    const focused = items.value[focusedIndex.value];
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a' && open.value && !(event.target instanceof HTMLInputElement && event.target.value)) {
        event.preventDefault();
        toggleAll(event);
        return true;
    }
    switch (event.key) {
        case 'ArrowDown':
            event.preventDefault();
            if (open.value) move(1);
            else show();
            return true;
        case 'ArrowUp':
            event.preventDefault();
            if (!open.value) show();
            else if (event.altKey) hide();
            else move(-1);
            return true;
        case 'Enter':
            event.preventDefault();
            if (!open.value) show();
            else toggle(focused, event);
            return true;
        case 'Tab':
            if (open.value) {
                // The panel lives at the end of <body>; tabbing on from it would leave the page's order.
                if (event.target === filterRef.value) event.preventDefault();
                hide(event.target === filterRef.value);
            }
            return true;
    }
    return false;
}

function onTriggerKeydown(event: KeyboardEvent) {
    if (props.disabled || listKeys(event)) return;
    switch (event.key) {
        case 'Home':
        case 'End':
            event.preventDefault();
            show(event.key === 'Home' ? 'first' : 'last');
            break;
        case ' ':
            event.preventDefault();
            if (!open.value) show();
            else toggle(items.value[focusedIndex.value], event);
            break;
        case 'Backspace':
        case 'Delete':
            if (props.showClear && hasValue.value && !open.value) {
                event.preventDefault();
                clear(event);
            }
            break;
        default:
            if (isPrintableKey(event)) {
                event.preventDefault();
                if (props.filter) {
                    show();
                    query.value = event.key;
                    onQuery();
                } else {
                    const q = typeahead.push(event.key);
                    const index = typeaheadIndex(
                        items.value.map((item) => item.label),
                        q,
                        focusedIndex.value,
                        isDisabledAt,
                        locale.value.code
                    );
                    if (index >= 0) {
                        show();
                        moveTo(index);
                    }
                }
            }
    }
}

// Space activates a <button> on keyup; the keydown already handled it.
function onTriggerKeyup(event: KeyboardEvent) {
    if (event.key === ' ') event.preventDefault();
}

function onQuery() {
    moveTo(firstIndex(items.value.length, isDisabledAt));
    emit('filter', query.value);
}

function onFilterInput(event: Event) {
    query.value = (event.target as HTMLInputElement).value;
    focusedIndex.value = -1;
    onQuery();
}

function onFilterKeydown(event: KeyboardEvent) {
    listKeys(event);
}

function onRootClick(event: MouseEvent) {
    if (props.disabled || (event.target as Element).closest('[data-vt-clear]')) return;
    if (open.value) hide();
    else {
        show();
        if (!props.filter) triggerRef.value?.focus();
    }
}

// Pressing inside the panel keeps focus where it is: on the combobox or in the search box.
function onOverlayPointerdown(event: PointerEvent) {
    keepFocus(event, (target) => target === filterRef.value || target.matches('input[type="checkbox"]'));
}

function optionState(item: OptionItem) {
    return { selected: isChosen(item.value), focused: focusedIndex.value === item.index, disabled: item.disabled || (!isChosen(item.value) && limitReached.value) };
}

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
            aria-haspopup="listbox"
            :aria-expanded="open ? 'true' : 'false'"
            :aria-controls="open && items.length ? listId : undefined"
            :aria-activedescendant="filter ? undefined : focusedId"
            :aria-invalid="invalid ? 'true' : undefined"
            :aria-busy="loading ? 'true' : undefined"
            @keydown="onTriggerKeydown"
            @keyup="onTriggerKeyup"
            @focus="emit('focus', $event)"
            @blur="emit('blur', $event)"
        >
            <slot name="value" :value="selected" :options="selectedOptions" :placeholder="placeholder">
                <template v-if="showChips">
                    <Chip v-for="(option, i) in selectedOptions" :key="i" :label="labelOf(option)" :unstyled="unstyled" v-bind="part('chip')" />
                </template>
                <template v-else>{{ commaText }}</template>
            </slot>
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
            <div v-if="open" ref="overlayRef" v-bind="part('overlay')" @pointerdown="onOverlayPointerdown">
                <div v-if="(showToggleAll && selectionLimit === undefined) || filter" v-bind="part('header')">
                    <label v-if="showToggleAll && selectionLimit === undefined" v-bind="part('toggleAll')">
                        <input
                            type="checkbox"
                            tabindex="-1"
                            v-bind="part('toggleAllInput')"
                            :checked="allState === 'all'"
                            :indeterminate="allState === 'some'"
                            :disabled="!enabledVisible.length"
                            :aria-label="locale.aria.selectAll"
                            @change="toggleAll"
                        />
                        <span v-bind="part('box', { checked: allState === 'all', indeterminate: allState === 'some' })">
                            <Icon v-if="allState !== 'none'" :icon="allState === 'all' ? 'check' : 'minus'" />
                        </span>
                    </label>
                    <div v-if="filter" v-bind="part('filter')">
                        <Icon icon="search" />
                        <input
                            ref="filterRef"
                            v-bind="part('filterInput')"
                            type="text"
                            role="searchbox"
                            autocomplete="off"
                            :value="query"
                            :placeholder="filterPlaceholder ?? locale.search"
                            :aria-label="filterPlaceholder ?? locale.search"
                            :aria-controls="items.length ? listId : undefined"
                            :aria-activedescendant="focusedId"
                            @input="onFilterInput"
                            @keydown="onFilterKeydown"
                        />
                    </div>
                </div>
                <slot name="header" />
                <ul
                    v-if="items.length"
                    :id="listId"
                    role="listbox"
                    aria-multiselectable="true"
                    v-bind="part('list')"
                    :aria-labelledby="listboxLabelledBy"
                    :aria-label="listboxLabelledBy ? undefined : listboxLabel"
                >
                    <template v-for="(group, g) in groups" :key="g">
                        <li v-if="group.label !== null" role="none" v-bind="part('group')">
                            <ul role="group" :aria-labelledby="`${id}-group-${g}`" v-bind="part('groupList')">
                                <li :id="`${id}-group-${g}`" role="presentation" v-bind="part('optionGroup')">
                                    <slot name="optiongroup" :group="group.raw">{{ group.label }}</slot>
                                </li>
                                <li
                                    v-for="item in group.items"
                                    :id="optionId(item.index)"
                                    :key="item.index"
                                    role="option"
                                    :aria-selected="isChosen(item.value) ? 'true' : 'false'"
                                    :aria-disabled="optionState(item).disabled ? 'true' : undefined"
                                    v-bind="part('option', optionState(item))"
                                    @click="toggle(item, $event)"
                                    @mousemove="item.disabled || (focusedIndex = item.index)"
                                >
                                    <span v-bind="part('box', { checked: isChosen(item.value) })" aria-hidden="true">
                                        <Icon v-if="isChosen(item.value)" icon="check" />
                                    </span>
                                    <slot name="option" :option="item.option" :index="item.index" :selected="isChosen(item.value)" :focused="focusedIndex === item.index">
                                        <span v-bind="part('optionLabel')">{{ item.label }}</span>
                                    </slot>
                                </li>
                            </ul>
                        </li>
                        <template v-else>
                            <li
                                v-for="item in group.items"
                                :id="optionId(item.index)"
                                :key="item.index"
                                role="option"
                                :aria-selected="isChosen(item.value) ? 'true' : 'false'"
                                :aria-disabled="optionState(item).disabled ? 'true' : undefined"
                                v-bind="part('option', optionState(item))"
                                @click="toggle(item, $event)"
                                @mousemove="item.disabled || (focusedIndex = item.index)"
                            >
                                <span v-bind="part('box', { checked: isChosen(item.value) })" aria-hidden="true">
                                    <Icon v-if="isChosen(item.value)" icon="check" />
                                </span>
                                <slot name="option" :option="item.option" :index="item.index" :selected="isChosen(item.value)" :focused="focusedIndex === item.index">
                                    <span v-bind="part('optionLabel')">{{ item.label }}</span>
                                </slot>
                            </li>
                        </template>
                    </template>
                </ul>
                <div v-else role="status" v-bind="part('empty')">
                    <slot name="empty">{{ emptyText }}</slot>
                </div>
                <slot name="footer" />
            </div>
        </Transition>
    </Teleport>
</template>
