<script setup lang="ts">
import { createTypeahead, equals, FilterService, firstIndex, getField, isPrintableKey, lastIndex, stepIndex, typeaheadIndex } from '@vitral/core';
import { selectStyle } from '@vitral/styles';
import { computed, mergeProps, nextTick, ref, useId } from 'vue';
import { useComponent, useSplitAttrs } from '../../base/useComponent';
import { useOverlay } from '../../composables/useOverlay';
import Icon from '../Icon/Icon.vue';
import type { SelectEmits, SelectProps, SelectSlots } from './types';
import { useOverlayTarget } from '../../composables/useOverlayTarget';
import { keepFocus } from '../../base/press';

// The WAI-ARIA "select-only combobox", with an optional search box. The
// combobox is a <button> so a <label for> reaches it; focus stays on it while
// the list is open and the active option is conveyed by aria-activedescendant,
// the way a native select behaves.

defineOptions({ name: 'VtSelect', inheritAttrs: false });

const props = withDefaults(defineProps<SelectProps>(), {
    unstyled: undefined,
    variant: undefined,
    options: () => [],
    optionGroupChildren: 'items',
    filterMatchMode: 'contains',
    placement: 'bottom-start',
    appendTo: 'body'
});
const overlayTarget = useOverlayTarget(() => props.appendTo);
const model = defineModel<unknown>();
const emit = defineEmits<SelectEmits>();
defineSlots<SelectSlots>();

const { part, config, locale } = useComponent(selectStyle, props);
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
const allOptions = computed(() => (props.optionGroupLabel ? props.options.flatMap(childrenOf) : props.options));
const compareKey = computed(() => (props.optionValue ? undefined : props.dataKey));
const isChosen = (value: unknown) => model.value !== null && model.value !== undefined && equals(model.value, value, compareKey.value);
const selectedOption = computed(() => allOptions.value.find((option) => isChosen(valueOf(option))));
const hasValue = computed(() => selectedOption.value !== undefined);
const selectedIndex = computed(() => items.value.findIndex((item) => isChosen(item.value)));
const isDisabledAt = (index: number) => items.value[index]?.disabled ?? true;
const focusedId = computed(() => (open.value && focusedIndex.value >= 0 ? optionId(focusedIndex.value) : undefined));

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

const emptyText = computed(() =>
    query.value.trim() ? (props.emptyFilterMessage ?? locale.value.emptySearchMessage) : (props.emptyMessage ?? locale.value.emptyMessage)
);
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

function focusAt(target: 'selected' | 'first' | 'last' | number) {
    const count = items.value.length;
    if (typeof target === 'number') focusedIndex.value = target;
    else if (target === 'first') focusedIndex.value = firstIndex(count, isDisabledAt);
    else if (target === 'last') focusedIndex.value = lastIndex(count, isDisabledAt);
    else focusedIndex.value = selectedIndex.value >= 0 ? selectedIndex.value : firstIndex(count, isDisabledAt);
    scrollToFocused();
}

function show(target: 'selected' | 'first' | 'last' | number = 'selected') {
    if (props.disabled) return;
    if (!open.value) {
        query.value = '';
        // A <label for> names the combobox; name the list with the same label.
        const label = triggerRef.value?.labels?.[0];
        if (label) {
            label.id ||= `${id}-label`;
            labelFromFor.value = label.id;
        }
        open.value = true;
        emit('show');
        if (props.filter) nextTick(() => filterRef.value?.focus());
    }
    focusAt(target);
}

function hide(returnFocus = true) {
    if (!open.value) return;
    open.value = false;
    focusedIndex.value = -1;
    typeahead.reset();
    emit('hide');
    if (returnFocus) triggerRef.value?.focus();
}

function choose(item: Item | undefined, event?: Event) {
    if (!item || item.disabled) return;
    const changed = !isChosen(item.value);
    model.value = item.value;
    if (changed) emit('change', { originalEvent: event, value: item.value });
    hide();
}

function clear(event: Event) {
    model.value = null;
    emit('change', { originalEvent: event, value: null });
    triggerRef.value?.focus();
}

function move(step: 1 | -1) {
    if (focusedIndex.value < 0) focusAt(step > 0 ? 'first' : 'last');
    else focusAt(stepIndex(items.value.length, focusedIndex.value, step, isDisabledAt));
}

function search(key: string) {
    const q = typeahead.push(key);
    const from = focusedIndex.value >= 0 ? focusedIndex.value : selectedIndex.value;
    const index = typeaheadIndex(
        items.value.map((item) => item.label),
        q,
        from,
        isDisabledAt,
        locale.value.code
    );
    if (index >= 0) show(index);
}

function onQuery() {
    focusAt('first');
    emit('filter', query.value);
}

function onTriggerKeydown(event: KeyboardEvent) {
    if (props.disabled) return;
    const focused = items.value[focusedIndex.value];
    switch (event.key) {
        case 'ArrowDown':
            event.preventDefault();
            if (open.value) move(1);
            else show();
            break;
        case 'ArrowUp':
            event.preventDefault();
            if (!open.value) show();
            else if (event.altKey) choose(focused, event);
            else move(-1);
            break;
        case 'Home':
            event.preventDefault();
            show('first');
            break;
        case 'End':
            event.preventDefault();
            show('last');
            break;
        case 'Enter':
        case ' ':
            event.preventDefault();
            if (!open.value) show();
            else if (focused) choose(focused, event);
            else hide();
            break;
        case 'Tab':
            if (open.value) {
                if (focused) choose(focused, event);
                else hide(false);
            }
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
                    search(event.key);
                }
            }
    }
}

// Space activates a <button> on keyup; the keydown already handled it.
function onTriggerKeyup(event: KeyboardEvent) {
    if (event.key === ' ') event.preventDefault();
}

function onFilterInput(event: Event) {
    query.value = (event.target as HTMLInputElement).value;
    onQuery();
}

function onFilterKeydown(event: KeyboardEvent) {
    switch (event.key) {
        case 'ArrowDown':
            event.preventDefault();
            move(1);
            break;
        case 'ArrowUp':
            event.preventDefault();
            move(-1);
            break;
        case 'Enter':
            event.preventDefault();
            choose(items.value[focusedIndex.value], event);
            break;
        case 'Tab':
            // The panel lives at the end of <body>; tabbing on from it would leave the page's order.
            event.preventDefault();
            hide();
            break;
    }
}

function onRootClick(event: MouseEvent) {
    if (props.disabled || (event.target as Element).closest('[data-vt-clear]')) return;
    if (open.value) hide();
    else {
        show();
        if (!props.filter) triggerRef.value?.focus();
    }
}

// Pressing inside the panel must not move focus off the combobox (or out of the search box).
function onOverlayPointerdown(event: PointerEvent) {
    keepFocus(event, (target) => target === filterRef.value);
}

function optionState(item: Item) {
    return { selected: isChosen(item.value), focused: focusedIndex.value === item.index, disabled: item.disabled };
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
            :aria-activedescendant="focusedId"
            :aria-invalid="invalid ? 'true' : undefined"
            :aria-busy="loading ? 'true' : undefined"
            @keydown="onTriggerKeydown"
            @keyup="onTriggerKeyup"
            @focus="emit('focus', $event)"
            @blur="emit('blur', $event)"
        >
            <slot name="value" :value="model" :option="selectedOption" :placeholder="placeholder">{{ hasValue ? labelOf(selectedOption) : placeholder || ' ' }}</slot>
        </button>
        <button v-if="showClear && hasValue && !disabled" type="button" tabindex="-1" data-vt-clear :aria-label="locale.clear" v-bind="part('clear')" @click="clear">
            <Icon icon="close" />
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
                <div v-if="filter || $slots.header" v-bind="part('header')">
                    <slot name="header" />
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
                <ul v-if="items.length" :id="listId" role="listbox" v-bind="part('list')" :aria-labelledby="listboxLabelledBy" :aria-label="listboxLabelledBy ? undefined : listboxLabel">
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
                                    @click="choose(item, $event)"
                                    @mousemove="item.disabled || (focusedIndex = item.index)"
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
                                @click="choose(item, $event)"
                                @mousemove="item.disabled || (focusedIndex = item.index)"
                            >
                                <slot name="option" :option="item.option" :index="item.index" :selected="isChosen(item.value)" :focused="focusedIndex === item.index">
                                    <span v-bind="part('optionLabel')">{{ item.label }}</span>
                                </slot>
                                <Icon v-if="checkmark && isChosen(item.value)" icon="check" v-bind="part('optionCheck')" />
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
