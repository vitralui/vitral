<script setup lang="ts">
import { equals, firstIndex, flattenOptions, formatMessage, groupOptions, lastIndex, normalizeText, optionLabel, stepIndex, type OptionItem } from '@vitral/core';
import { autocompleteStyle } from '@vitral/styles';
import { computed, mergeProps, nextTick, onBeforeUnmount, ref, useId, watch } from 'vue';
import { useComponent, useSplitAttrs } from '../../base/useComponent';
import { useOverlay } from '../../composables/useOverlay';
import Chip from '../Chip/Chip.vue';
import Icon from '../Icon/Icon.vue';
import type { AutoCompleteEmits, AutoCompleteProps, AutoCompleteSlots } from './types';
import { useOverlayTarget } from '../../composables/useOverlayTarget';
import { keepFocus } from '../../base/press';

// The WAI-ARIA editable combobox with list autocomplete. Focus stays in the
// text box; typing asks the app for suggestions (`complete`), Down and Up move
// through them by aria-activedescendant, Enter takes one, Escape closes the
// list and then clears the box. How many suggestions arrived is announced in a
// polite live region. In multiple mode the values are chips before the text;
// each chip's remove button is a real button, and Backspace in an empty box
// removes the last one.

defineOptions({ name: 'VtAutoComplete', inheritAttrs: false });

const props = withDefaults(defineProps<AutoCompleteProps>(), {
    unstyled: undefined,
    variant: undefined,
    suggestions: () => [],
    optionGroupChildren: 'items',
    dropdownMode: 'blank',
    delay: 300,
    minLength: 1,
    showEmptyMessage: true,
    placement: 'bottom-start',
    appendTo: 'body'
});
const overlayTarget = useOverlayTarget(() => props.appendTo);
const model = defineModel<unknown>();
const emit = defineEmits<AutoCompleteEmits>();
defineSlots<AutoCompleteSlots>();

const { part, config, locale } = useComponent(autocompleteStyle, props);
const { rootAttrs, controlAttrs } = useSplitAttrs();

const id = useId();
const listId = `${id}-list`;
const optionId = (index: number) => `${id}-option-${index}`;

const rootRef = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);
const overlayRef = ref<HTMLElement | null>(null);

const text = ref('');
const open = ref(false);
const focused = ref(false);
const focusedIndex = ref(-1);
const labelFromFor = ref<string>();
let searching = false;
let timer: ReturnType<typeof setTimeout> | undefined;

const fields = computed(() => ({
    optionLabel: props.optionLabel,
    optionDisabled: props.optionDisabled,
    optionGroupLabel: props.optionGroupLabel,
    optionGroupChildren: props.optionGroupChildren
}));
const labelOf = (option: unknown) => optionLabel(option, fields.value);
const groups = computed(() => groupOptions(props.suggestions, fields.value));
const items = computed(() => groups.value.flatMap((group) => group.items));
const isDisabledAt = (index: number) => items.value[index]?.disabled ?? true;

const selectedValues = computed<unknown[]>(() => (props.multiple ? (Array.isArray(model.value) ? model.value : []) : []));
const isChosen = (option: unknown) =>
    props.multiple ? selectedValues.value.some((v) => equals(v, option, props.dataKey)) : model.value !== null && model.value !== undefined && equals(model.value, option, props.dataKey);
const displayOf = (value: unknown) => (value === null || value === undefined ? '' : typeof value === 'string' ? value : labelOf(value));

const hasValue = computed(() => (props.multiple ? selectedValues.value.length > 0 : !!displayOf(model.value)));
const editable = computed(() => !props.disabled && !props.readonly);
const focusedId = computed(() => (open.value && focusedIndex.value >= 0 && items.value[focusedIndex.value] ? optionId(focusedIndex.value) : undefined));
const statusText = computed(() => {
    if (!open.value) return '';
    return items.value.length ? formatMessage(locale.value.searchMessage, { count: items.value.length }) : (props.emptySearchMessage ?? locale.value.emptySearchMessage);
});
const listLabelledBy = computed(() => (controlAttrs.value['aria-labelledby'] as string | undefined) ?? labelFromFor.value);
const listLabel = computed(() => (controlAttrs.value['aria-label'] as string | undefined) ?? (controlAttrs.value.placeholder as string | undefined) ?? locale.value.search);

const state = computed(() => ({
    size: props.size,
    variant: props.variant ?? config.inputVariant,
    invalid: props.invalid,
    disabled: props.disabled,
    readonly: props.readonly,
    fluid: props.fluid,
    open: open.value,
    multiple: props.multiple,
    dropdown: props.dropdown
}));

// The box shows the chosen value in single mode; in multiple mode it only holds the query.
watch(
    () => model.value,
    (value) => {
        if (!props.multiple) text.value = displayOf(value);
    },
    { immediate: true }
);

useOverlay({
    anchor: rootRef,
    overlay: overlayRef,
    matchWidth: true,
    placement: () => props.placement,
    onEscape: () => hide(),
    onPointerDownOutside: () => hide()
});

// New suggestions after a request open the list, while the box still has focus.
watch(
    () => props.suggestions,
    () => {
        if (!searching) return;
        searching = false;
        if (!focused.value) return;
        if (items.value.length || props.showEmptyMessage) show();
        else hide();
        focusedIndex.value = props.autoOptionFocus ? firstIndex(items.value.length, isDisabledAt) : -1;
    }
);

function show() {
    if (open.value || props.disabled) return;
    const label = inputRef.value?.labels?.[0];
    if (label) {
        label.id ||= `${id}-label`;
        labelFromFor.value = label.id;
    }
    open.value = true;
    emit('show');
}

function hide() {
    if (!open.value) return;
    open.value = false;
    focusedIndex.value = -1;
    emit('hide');
}

function search(query: string, event: Event) {
    clearTimeout(timer);
    searching = true;
    emit('complete', { originalEvent: event, query });
}

function scrollToFocused() {
    nextTick(() => {
        if (focusedId.value) document.getElementById(focusedId.value)?.scrollIntoView?.({ block: 'nearest' });
    });
}

function moveTo(index: number) {
    focusedIndex.value = index;
    scrollToFocused();
}

function choose(item: OptionItem | undefined, event: Event) {
    if (!item || item.disabled) return;
    if (props.multiple) {
        if (!isChosen(item.option)) {
            model.value = [...selectedValues.value, item.option];
            emit('option-select', { originalEvent: event, value: item.option });
        }
        text.value = '';
    } else {
        model.value = item.option;
        text.value = labelOf(item.option);
        emit('option-select', { originalEvent: event, value: item.option });
    }
    hide();
    inputRef.value?.focus();
}

function removeAt(index: number, event: Event) {
    const removed = selectedValues.value[index];
    model.value = selectedValues.value.filter((_, i) => i !== index);
    emit('option-unselect', { originalEvent: event, value: removed });
    inputRef.value?.focus();
}

function clear() {
    clearTimeout(timer);
    text.value = '';
    model.value = props.multiple ? [] : null;
    hide();
    emit('clear');
    inputRef.value?.focus();
}

function onInput(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    text.value = query;
    focusedIndex.value = -1;
    if (!props.multiple && !props.forceSelection) model.value = query;
    clearTimeout(timer);
    if (query.length < props.minLength) {
        hide();
        return;
    }
    timer = setTimeout(() => search(query, event), props.delay);
}

function onKeydown(event: KeyboardEvent) {
    if (props.disabled) return;
    const count = items.value.length;
    switch (event.key) {
        case 'ArrowDown':
            event.preventDefault();
            if (!open.value) {
                if (count) show();
                else if (props.dropdown) onDropdown(event);
                if (event.altKey) return;
            }
            if (!event.altKey) moveTo(focusedIndex.value < 0 ? firstIndex(count, isDisabledAt) : stepIndex(count, focusedIndex.value, 1, isDisabledAt));
            break;
        case 'ArrowUp':
            if (!open.value) return;
            event.preventDefault();
            if (event.altKey) {
                if (focusedIndex.value >= 0) choose(items.value[focusedIndex.value], event);
                else hide();
            } else {
                moveTo(focusedIndex.value < 0 ? lastIndex(count, isDisabledAt) : stepIndex(count, focusedIndex.value, -1, isDisabledAt));
            }
            break;
        case 'ArrowLeft':
        case 'ArrowRight':
        case 'Home':
        case 'End':
            // The caret moves; the list lets go of its focused option.
            focusedIndex.value = -1;
            break;
        case 'Enter':
            if (!open.value) return;
            event.preventDefault();
            if (focusedIndex.value >= 0) choose(items.value[focusedIndex.value], event);
            else hide();
            break;
        case 'Escape':
            if (open.value) return; // the overlay's layer closes it
            if (text.value && editable.value) {
                event.preventDefault();
                text.value = '';
                if (!props.multiple) model.value = null;
            }
            break;
        case 'Tab':
            if (open.value && focusedIndex.value >= 0) choose(items.value[focusedIndex.value], event);
            else hide();
            break;
        case 'Backspace':
            if (props.multiple && editable.value && text.value === '' && selectedValues.value.length) {
                event.preventDefault();
                removeAt(selectedValues.value.length - 1, event);
            }
            break;
    }
}

function onFocus(event: FocusEvent) {
    focused.value = true;
    if (props.completeOnFocus && editable.value) search(text.value, event);
    emit('focus', event);
}

function onBlur(event: FocusEvent) {
    focused.value = false;
    if (props.forceSelection && editable.value) enforceSelection();
    emit('blur', event);
}

/** Keeps only a chosen suggestion: text that names one exactly takes it, anything else is cleared. */
function enforceSelection() {
    const typed = text.value;
    if (!props.multiple && typed === displayOf(model.value)) return;
    const needle = normalizeText(typed.trim(), locale.value.code);
    const match = needle ? flattenOptions(props.suggestions, fields.value).find((option) => normalizeText(labelOf(option), locale.value.code) === needle) : undefined;
    if (match !== undefined && !(props.multiple && isChosen(match))) {
        if (props.multiple) model.value = [...selectedValues.value, match];
        else model.value = match;
    } else if (!props.multiple) {
        model.value = null;
    }
    text.value = props.multiple ? '' : displayOf(model.value);
}

function onDropdown(event: Event) {
    if (!editable.value) return;
    inputRef.value?.focus();
    const query = props.dropdownMode === 'current' ? text.value : '';
    emit('dropdown-click', { originalEvent: event, query });
    if (open.value) hide();
    else search(query, event);
}

// A press on the field's padding focuses the text; one inside the list keeps it there.
function onRootPointerdown(event: PointerEvent) {
    const target = event.target as Element;
    if (target === inputRef.value || target.closest('button')) return;
    // Not prevented for a finger: the tap has to survive. The focus it was
    // taking is moved here either way.
    keepFocus(event);
    inputRef.value?.focus();
}

onBeforeUnmount(() => clearTimeout(timer));

function optionState(item: OptionItem) {
    return { selected: isChosen(item.option), focused: focusedIndex.value === item.index, disabled: item.disabled };
}

defineExpose({ show, hide, search: (query = text.value) => search(query, new Event('search')), focus: () => inputRef.value?.focus() });
</script>

<template>
    <div ref="rootRef" v-bind="mergeProps(rootAttrs, part('root', state))" @pointerdown="onRootPointerdown">
        <ul v-if="multiple && selectedValues.length" :aria-label="locale.aria.selectedItems" v-bind="part('chips')">
            <li v-for="(value, i) in selectedValues" :key="i" v-bind="part('chipItem')">
                <slot name="chip" :value="value" :label="displayOf(value)" :remove="(e: Event) => removeAt(i, e)">
                    <Chip :label="displayOf(value)" :removable="editable" :unstyled="unstyled" v-bind="part('chip')" @remove="removeAt(i, $event)" />
                </slot>
            </li>
        </ul>
        <input
            ref="inputRef"
            v-bind="mergeProps(controlAttrs, part('input'))"
            type="text"
            role="combobox"
            autocomplete="off"
            aria-autocomplete="list"
            aria-haspopup="listbox"
            :value="text"
            :disabled="disabled"
            :readonly="readonly"
            :aria-expanded="open ? 'true' : 'false'"
            :aria-controls="open && items.length ? listId : undefined"
            :aria-activedescendant="focusedId"
            :aria-invalid="invalid ? 'true' : undefined"
            :aria-busy="loading ? 'true' : undefined"
            @input="onInput"
            @keydown="onKeydown"
            @focus="onFocus"
            @blur="onBlur"
        />
        <Icon v-if="loading" icon="spinner" spin v-bind="part('loader')" />
        <button v-if="showClear && hasValue && editable" type="button" tabindex="-1" :aria-label="locale.clear" v-bind="part('clear')" @click="clear">
            <Icon icon="close" />
        </button>
        <button
            v-if="dropdown"
            type="button"
            tabindex="-1"
            :disabled="disabled"
            :aria-label="locale.aria.showSuggestions"
            aria-haspopup="listbox"
            :aria-expanded="open ? 'true' : 'false'"
            v-bind="part('dropdown')"
            @click="onDropdown"
        >
            <slot name="dropdownicon"><Icon icon="chevronDown" /></slot>
        </button>
        <span role="status" aria-live="polite" v-bind="part('status')">{{ statusText }}</span>
    </div>
    <Teleport :to="overlayTarget" :disabled="appendTo === 'self'">
        <Transition name="vt-overlay">
            <div v-if="open" ref="overlayRef" v-bind="part('overlay')" @pointerdown="keepFocus">
                <slot name="header" />
                <ul v-if="items.length" :id="listId" role="listbox" v-bind="part('list')" :aria-labelledby="listLabelledBy" :aria-label="listLabelledBy ? undefined : listLabel" :aria-multiselectable="multiple ? 'true' : undefined">
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
                                    :aria-selected="isChosen(item.option) ? 'true' : 'false'"
                                    :aria-disabled="item.disabled ? 'true' : undefined"
                                    v-bind="part('option', optionState(item))"
                                    @click="choose(item, $event)"
                                    @mousemove="item.disabled || (focusedIndex = item.index)"
                                >
                                    <slot name="option" :option="item.option" :index="item.index" :selected="isChosen(item.option)" :focused="focusedIndex === item.index">
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
                                :aria-selected="isChosen(item.option) ? 'true' : 'false'"
                                :aria-disabled="item.disabled ? 'true' : undefined"
                                v-bind="part('option', optionState(item))"
                                @click="choose(item, $event)"
                                @mousemove="item.disabled || (focusedIndex = item.index)"
                            >
                                <slot name="option" :option="item.option" :index="item.index" :selected="isChosen(item.option)" :focused="focusedIndex === item.index">
                                    <span v-bind="part('optionLabel')">{{ item.label }}</span>
                                </slot>
                            </li>
                        </template>
                    </template>
                </ul>
                <div v-else v-bind="part('empty')">
                    <slot name="empty">{{ emptySearchMessage ?? locale.emptySearchMessage }}</slot>
                </div>
                <slot name="footer" />
            </div>
        </Transition>
    </Teleport>
</template>
