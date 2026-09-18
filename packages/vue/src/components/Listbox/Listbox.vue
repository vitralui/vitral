<script setup lang="ts">
import { createTypeahead, equals, FilterService, firstIndex, getField, indexRange, isPrintableKey, lastIndex, selectRows, stepIndex, typeaheadIndex } from '@vitral/core';
import { listboxStyle } from '@vitral/styles';
import { computed, mergeProps, nextTick, ref, useId } from 'vue';
import { useComponent, useSplitAttrs } from '../../base/useComponent';
import Icon from '../Icon/Icon.vue';
import type { ListboxEmits, ListboxProps, ListboxSlots } from './types';

// The WAI-ARIA listbox. Focus stays on the role="listbox" element and the
// active option is conveyed by aria-activedescendant. Structure, grouping and
// filtering mirror Select, so the inline list and the dropdown are one family.

defineOptions({ name: 'VtListbox', inheritAttrs: false });

const props = withDefaults(defineProps<ListboxProps>(), {
    unstyled: undefined,
    options: () => [],
    optionGroupChildren: 'items',
    filterMatchMode: 'contains',
    scrollHeight: '14rem',
    selectOnFocus: true
});
const model = defineModel<unknown>();
const emit = defineEmits<ListboxEmits>();
defineSlots<ListboxSlots>();

const { part, locale } = useComponent(listboxStyle, props);
const { rootAttrs, controlAttrs } = useSplitAttrs();

const id = useId();
const listId = computed(() => (controlAttrs.value.id as string | undefined) ?? `${id}-list`);
const optionId = (index: number) => `${id}-option-${index}`;

const listRef = ref<HTMLElement | null>(null);
const query = ref('');
const focusedIndex = ref(-1);
const anchorIndex = ref(-1);
const hasFocus = ref(false);
const hovering = ref(false);
const typeahead = createTypeahead();

interface Item {
    option: unknown;
    index: number;
    label: string;
    value: unknown;
    disabled: boolean;
}

interface Group {
    label: string | null;
    raw: unknown;
    items: Item[];
}

const labelOf = (option: unknown): string => {
    const value = props.optionLabel ? getField(option, props.optionLabel) : option;
    return value === null || value === undefined ? '' : String(value);
};
const valueOf = (option: unknown): unknown => (props.optionValue ? getField(option, props.optionValue) : option);
const disabledOf = (option: unknown): boolean => !!(props.optionDisabled && getField(option, props.optionDisabled));
const childrenOf = (group: unknown): unknown[] => (getField(group, props.optionGroupChildren) as unknown[] | undefined) ?? [];

const matches = (option: unknown): boolean => {
    const q = query.value;
    if (!props.filter || !q.trim()) return true;
    const code = locale.value.code;
    if (props.filterFields?.length) return props.filterFields.some((field) => FilterService.matches(getField(option, field), q, props.filterMatchMode, code));
    return FilterService.matches(labelOf(option), q, props.filterMatchMode, code);
};

/** Visible options, grouped when groups are configured, indexed in reading order across groups. */
const groups = computed<Group[]>(() => {
    let index = 0;
    const build = (options: unknown[]): Item[] =>
        options.filter(matches).map((option) => ({ option, index: index++, label: labelOf(option), value: valueOf(option), disabled: disabledOf(option) }));
    const groupLabel = props.optionGroupLabel;
    if (groupLabel) {
        return props.options.map((raw) => ({ label: String(getField(raw, groupLabel) ?? ''), raw, items: build(childrenOf(raw)) })).filter((group) => group.items.length > 0);
    }
    return [{ label: null, raw: null, items: build(props.options) }];
});

const items = computed(() => groups.value.flatMap((group) => group.items));
const compareKey = computed(() => (props.optionValue ? undefined : props.dataKey));
const selectedValues = computed<unknown[]>(() => (props.multiple ? (Array.isArray(model.value) ? model.value : []) : []));
const isChosen = (value: unknown): boolean => {
    if (props.multiple) return selectedValues.value.some((v) => equals(v, value, compareKey.value));
    return model.value !== null && model.value !== undefined && equals(model.value, value, compareKey.value);
};
const isDisabledAt = (index: number) => items.value[index]?.disabled ?? true;
const firstSelectedIndex = computed(() => items.value.findIndex((item) => isChosen(item.value)));
const activeId = computed(() => (focusedIndex.value >= 0 && items.value[focusedIndex.value] ? optionId(focusedIndex.value) : undefined));

const state = computed(() => ({ disabled: props.disabled, invalid: props.invalid, fluid: props.fluid }));
const emptyText = computed(() =>
    query.value.trim() ? (props.emptyFilterMessage ?? locale.value.emptySearchMessage) : (props.emptyMessage ?? locale.value.emptyMessage)
);

function scrollToFocused() {
    nextTick(() => {
        if (activeId.value) document.getElementById(activeId.value)?.scrollIntoView?.({ block: 'nearest' });
    });
}

function moveTo(index: number) {
    if (index < 0) return;
    focusedIndex.value = index;
    scrollToFocused();
}

function commit(value: unknown, event?: Event) {
    model.value = value;
    emit('change', { originalEvent: event, value });
}

function choose(item: Item | undefined, event?: Event) {
    if (!item || item.disabled || props.disabled) return;
    if (props.multiple) return toggle(item, event);
    if (!isChosen(item.value)) commit(item.value, event);
}

function toggle(item: Item | undefined, event?: Event) {
    if (!item || item.disabled || props.disabled) return;
    anchorIndex.value = item.index;
    commit(selectRows(selectedValues.value, [item.value], !isChosen(item.value), compareKey.value), event);
}

/** Adds every enabled option between two indices to the selection: Shift-click, Shift+Space, Shift+arrows. */
function selectRange(from: number, to: number, event?: Event) {
    const values = indexRange(from, to)
        .map((i) => items.value[i])
        .filter((item): item is Item => !!item && !item.disabled)
        .map((item) => item.value);
    commit(selectRows(selectedValues.value, values, true, compareKey.value), event);
}

function toggleAll(event: Event) {
    const values = items.value.filter((item) => !item.disabled).map((item) => item.value);
    const all = values.length > 0 && values.every((v) => isChosen(v));
    commit(selectRows(selectedValues.value, values, !all, compareKey.value), event);
}

function onFocus(event: FocusEvent) {
    hasFocus.value = true;
    if (focusedIndex.value < 0 || !items.value[focusedIndex.value]) {
        focusedIndex.value = firstSelectedIndex.value >= 0 ? firstSelectedIndex.value : firstIndex(items.value.length, isDisabledAt);
        scrollToFocused();
    }
    emit('focus', event);
}

function onBlur(event: FocusEvent) {
    hasFocus.value = false;
    typeahead.reset();
    emit('blur', event);
}

function onKeydown(event: KeyboardEvent) {
    if (props.disabled) return;
    const count = items.value.length;
    const from = focusedIndex.value;
    const focused = items.value[from];
    const multiple = !!props.multiple;
    const followsFocus = !multiple && props.selectOnFocus;

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a' && multiple) {
        event.preventDefault();
        toggleAll(event);
        return;
    }

    switch (event.key) {
        case 'ArrowDown':
        case 'ArrowUp': {
            event.preventDefault();
            const step = event.key === 'ArrowDown' ? 1 : -1;
            const to = from < 0 ? (step > 0 ? firstIndex(count, isDisabledAt) : lastIndex(count, isDisabledAt)) : stepIndex(count, from, step, isDisabledAt);
            moveTo(to);
            if (multiple && event.shiftKey && to !== from) selectRange(from < 0 ? to : from, to, event);
            else if (followsFocus) choose(items.value[to], event);
            break;
        }
        case 'Home':
        case 'End': {
            event.preventDefault();
            const to = event.key === 'Home' ? firstIndex(count, isDisabledAt) : lastIndex(count, isDisabledAt);
            moveTo(to);
            if (multiple && event.shiftKey && (event.ctrlKey || event.metaKey) && from >= 0) selectRange(from, to, event);
            else if (followsFocus) choose(items.value[to], event);
            break;
        }
        case ' ':
            event.preventDefault();
            if (multiple && event.shiftKey && anchorIndex.value >= 0 && from >= 0) selectRange(anchorIndex.value, from, event);
            else choose(focused, event);
            break;
        case 'Enter':
            event.preventDefault();
            choose(focused, event);
            break;
        default:
            if (isPrintableKey(event)) {
                event.preventDefault();
                const q = typeahead.push(event.key);
                const index = typeaheadIndex(
                    items.value.map((item) => item.label),
                    q,
                    from,
                    isDisabledAt,
                    locale.value.code
                );
                if (index >= 0) {
                    moveTo(index);
                    if (followsFocus) choose(items.value[index], event);
                }
            }
    }
}

function onOptionClick(item: Item, event: MouseEvent) {
    if (props.disabled || item.disabled) return;
    focusedIndex.value = item.index;
    if (props.multiple && event.shiftKey && anchorIndex.value >= 0) selectRange(anchorIndex.value, item.index, event);
    else choose(item, event);
}

function onOptionMousemove(item: Item) {
    hovering.value = true;
    if (!item.disabled && !props.disabled) focusedIndex.value = item.index;
}

function onFilterInput(event: Event) {
    query.value = (event.target as HTMLInputElement).value;
    focusedIndex.value = firstIndex(items.value.length, isDisabledAt);
    emit('filter', query.value);
}

function onFilterKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown' && items.value.length) {
        event.preventDefault();
        listRef.value?.focus();
    }
}

function optionState(item: Item) {
    return { selected: isChosen(item.value), focused: (hasFocus.value || hovering.value) && focusedIndex.value === item.index, disabled: item.disabled || props.disabled };
}

defineExpose({ focus: () => listRef.value?.focus() });
</script>

<template>
    <div v-bind="mergeProps(rootAttrs, part('root', state))">
        <div v-if="filter || $slots.header" v-bind="part('header')">
            <slot name="header" />
            <div v-if="filter" v-bind="part('filter')">
                <Icon icon="search" />
                <input
                    v-bind="part('filterInput')"
                    type="text"
                    role="searchbox"
                    autocomplete="off"
                    :value="query"
                    :disabled="disabled"
                    :placeholder="filterPlaceholder ?? locale.search"
                    :aria-label="filterPlaceholder ?? locale.search"
                    :aria-controls="listId"
                    @input="onFilterInput"
                    @keydown="onFilterKeydown"
                />
            </div>
        </div>
        <ul
            ref="listRef"
            role="listbox"
            v-bind="mergeProps(controlAttrs, part('list'))"
            :id="listId"
            :tabindex="disabled ? -1 : 0"
            :style="{ maxHeight: scrollHeight }"
            :aria-multiselectable="multiple ? 'true' : undefined"
            :aria-activedescendant="activeId"
            :aria-disabled="disabled ? 'true' : undefined"
            :aria-invalid="invalid ? 'true' : undefined"
            @focus="onFocus"
            @blur="onBlur"
            @keydown="onKeydown"
            @mouseleave="hovering = false"
        >
            <template v-for="(group, g) in groups" :key="g">
                <!-- An <li> may not be a group; it steps aside and a <ul role="group"> holds the label and the options. -->
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
                            :aria-disabled="item.disabled ? 'true' : undefined"
                            v-bind="part('option', optionState(item))"
                            @click="onOptionClick(item, $event)"
                            @mousemove="onOptionMousemove(item)"
                        >
                            <slot name="option" :option="item.option" :index="item.index" :selected="isChosen(item.value)" :focused="focusedIndex === item.index">
                                <span v-bind="part('optionLabel')">{{ item.label }}</span>
                            </slot>
                            <Icon v-if="checkmark && isChosen(item.value)" icon="check" v-bind="part('optionCheck')" />
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
                        :aria-disabled="item.disabled ? 'true' : undefined"
                        v-bind="part('option', optionState(item))"
                        @click="onOptionClick(item, $event)"
                        @mousemove="onOptionMousemove(item)"
                    >
                        <slot name="option" :option="item.option" :index="item.index" :selected="isChosen(item.value)" :focused="focusedIndex === item.index">
                            <span v-bind="part('optionLabel')">{{ item.label }}</span>
                        </slot>
                        <Icon v-if="checkmark && isChosen(item.value)" icon="check" v-bind="part('optionCheck')" />
                    </li>
                </template>
            </template>
        </ul>
        <div v-if="!items.length" role="status" v-bind="part('empty')">
            <slot name="empty">{{ emptyText }}</slot>
        </div>
        <slot name="footer" />
    </div>
</template>
