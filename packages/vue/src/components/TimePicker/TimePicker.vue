<script setup lang="ts">
import { clampMinutes, formatMinutes, nearestOption, parseMinutes, parseTime, timeKeyTarget, timeOptions, usesHour12 } from '@vitral/core';
import { timepickerStyle } from '@vitral/styles';
import { computed, mergeProps, nextTick, ref, useId, watch } from 'vue';
import { useComponent, useSplitAttrs } from '../../base/useComponent';
import { useOverlay } from '../../composables/useOverlay';
import { useOverlayTarget } from '../../composables/useOverlayTarget';
import Button from '../Button/Button.vue';
import Icon from '../Icon/Icon.vue';
import type { TimePickerEmits, TimePickerProps, TimePickerSlots } from './types';

// A text box that takes typed times, and a button that opens a listbox of
// them. The WAI-ARIA combobox pattern, not the date picker's dialog: a time is
// one number from a list, not a grid to be navigated in two directions — the
// arrows move through the list, Enter takes one, Escape shuts it.
//
// The value is minutes past midnight. A time has no day and no zone of its
// own, and binding it to a `Date` would give it both.

defineOptions({ name: 'VtTimePicker', inheritAttrs: false });

const props = withDefaults(defineProps<TimePickerProps>(), {
    unstyled: undefined,
    variant: undefined,
    step: 30,
    minTime: null,
    maxTime: null,
    // Absent, not false: an unset boolean prop is `false` to Vue, and this one
    // has to tell "what the locale writes" from "asked for twenty-four hour".
    hour12: undefined,
    placement: 'bottom-start',
    appendTo: 'body'
});
const overlayTarget = useOverlayTarget(() => props.appendTo);
const model = defineModel<number | null>();
const emit = defineEmits<TimePickerEmits>();
defineSlots<TimePickerSlots>();

const { part, config, locale } = useComponent(timepickerStyle, props);
const { rootAttrs, controlAttrs } = useSplitAttrs();

const id = useId();
const listId = `${id}-list`;
const rootRef = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);
const buttonRef = ref<HTMLButtonElement | null>(null);
const panelRef = ref<HTMLElement | null>(null);
const listRef = ref<HTMLElement | null>(null);
const open = ref(false);

/** A bound as minutes, whether it was given as minutes or as `'09:00'`. */
const bound = (value: number | string | null | undefined) => (value === null || value === undefined ? null : typeof value === 'number' ? value : parseTime(value, 0));
const min = computed(() => bound(props.minTime));
const max = computed(() => bound(props.maxTime));
const twelve = computed(() => props.hour12 ?? usesHour12(locale.value.code));

const options = computed(() => timeOptions({ step: props.step, min: min.value, max: max.value, locale: locale.value.code, hour12: twelve.value, seconds: props.seconds }));
const write = (minutes: number | null) => formatMinutes(minutes ?? 0, { locale: locale.value.code, hour12: twelve.value, seconds: props.seconds });

/** What the box shows: what is being typed, or the value written out. */
const text = ref('');
watch(
    () => [model.value, twelve.value, props.seconds] as const,
    () => (text.value = model.value === null || model.value === undefined ? '' : write(model.value)),
    { immediate: true }
);

/** The option the arrows are on. It follows the value while the list opens. */
const active = ref(-1);
const selected = computed(() => nearestOption(options.value, model.value ?? null));

function commit(minutes: number | null) {
    const value = minutes === null ? null : clampMinutes(minutes, min.value, max.value);
    model.value = value;
    text.value = value === null ? '' : write(value);
    if (value !== null) emit('timeSelect', value);
}

function toggle() {
    if (props.disabled || props.readonly) return;
    open.value ? hide() : show();
}

function show() {
    if (open.value) return;
    open.value = true;
    active.value = selected.value >= 0 ? selected.value : 0;
    emit('show');
    void nextTick(() => scrollActiveIntoView());
}

function hide(restore = false) {
    if (!open.value) return;
    open.value = false;
    emit('hide');
    if (restore) inputRef.value?.focus();
}

function scrollActiveIntoView() {
    listRef.value?.querySelector<HTMLElement>('[data-vt-active="true"]')?.scrollIntoView({ block: 'nearest' });
}

function move(to: number) {
    if (!options.value.length) return;
    active.value = Math.max(0, Math.min(options.value.length - 1, to));
    void nextTick(() => scrollActiveIntoView());
}

function onInputKeydown(event: KeyboardEvent) {
    if (props.disabled || props.readonly) return;
    if (event.key === 'Escape') {
        if (open.value) {
            event.preventDefault();
            hide();
        }
        return;
    }
    if (event.key === 'Enter') {
        event.preventDefault();
        if (open.value && active.value >= 0) commit(options.value[active.value]!.minutes);
        else commit(parseMinutes(text.value, twelve.value));
        hide();
        return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (!open.value) return show();
        return move(active.value + (event.key === 'ArrowDown' ? 1 : -1));
    }
    if (event.key === 'Home' || event.key === 'End') {
        if (!open.value) return;
        event.preventDefault();
        return move(event.key === 'Home' ? 0 : options.value.length - 1);
    }
    // Page Up and Page Down step the value itself by an hour, which is what a
    // spin box does and what someone adjusting a time expects.
    const stepped = timeKeyTarget(model.value ?? 0, event.key, props.step, { min: min.value, max: max.value });
    if (stepped !== null && (event.key === 'PageUp' || event.key === 'PageDown')) {
        event.preventDefault();
        commit(stepped);
    }
}

function onInputBlur(event: FocusEvent) {
    // What was typed is taken when the box is left, the way a date box takes it.
    if (!open.value) commit(text.value.trim() ? parseMinutes(text.value, twelve.value) : null);
    emit('blur', event);
}

function pick(minutes: number) {
    commit(minutes);
    hide(true);
}

function clear() {
    commit(null);
    emit('clear');
}

useOverlay({
    anchor: buttonRef,
    overlay: computed(() => (props.inline ? null : panelRef.value)),
    placement: () => props.placement,
    onEscape: () => hide(true),
    onPointerDownOutside: () => hide()
});

const state = computed(() => ({ size: props.size, variant: props.variant ?? config.inputVariant, invalid: props.invalid, disabled: props.disabled, fluid: props.fluid, open: open.value }));
const panelAttrs = computed(() => ({ style: props.appendTo === 'self' || props.inline ? undefined : { position: 'absolute' as const } }));

defineExpose({ focus: () => inputRef.value?.focus(), show, hide: () => hide(), input: inputRef });
</script>

<template>
    <div v-if="!inline" ref="rootRef" v-bind="mergeProps(rootAttrs, part('root', state))">
        <input
            ref="inputRef"
            type="text"
            role="combobox"
            autocomplete="off"
            v-bind="mergeProps(controlAttrs, part('input'))"
            :value="text"
            :placeholder="placeholder"
            :disabled="disabled"
            :readonly="readonly"
            :aria-invalid="invalid ? 'true' : undefined"
            :aria-expanded="open ? 'true' : 'false'"
            :aria-controls="open ? listId : undefined"
            :aria-activedescendant="open && active >= 0 ? `${id}-o${active}` : undefined"
            aria-autocomplete="none"
            @input="text = ($event.target as HTMLInputElement).value"
            @keydown="onInputKeydown"
            @focus="emit('focus', $event)"
            @blur="onInputBlur"
        />
        <button
            ref="buttonRef"
            type="button"
            tabindex="-1"
            v-bind="part('dropdown')"
            :disabled="disabled || readonly"
            :aria-label="locale.aria.chooseDate"
            @click="toggle"
        >
            <slot name="dropdownicon"><Icon icon="clock" /></slot>
        </button>
    </div>

    <Teleport :to="overlayTarget" :disabled="inline || appendTo === 'self'">
        <Transition name="vt-overlay">
            <div v-if="inline || open" ref="panelRef" v-bind="mergeProps(panelAttrs, part('panel', { inline, disabled }))">
                <ul :id="listId" ref="listRef" role="listbox" v-bind="part('list')" :aria-label="locale.aria.chooseDate">
                    <li
                        v-for="(option, index) in options"
                        :id="`${id}-o${index}`"
                        :key="option.minutes"
                        role="option"
                        :data-vt-active="index === active ? 'true' : undefined"
                        :aria-selected="index === selected ? 'true' : 'false'"
                        v-bind="part('option', { selected: index === selected, active: index === active })"
                        @click="pick(option.minutes)"
                        @mousemove="active = index"
                    >
                        <slot name="option" :minutes="option.minutes" :label="option.label" :selected="index === selected">{{ option.label }}</slot>
                    </li>
                </ul>
                <div v-if="$slots.footer || showClearButton" v-bind="part('footer')">
                    <slot name="footer" :minutes="model ?? null" :clear="clear">
                        <Button :label="locale.clear" severity="secondary" variant="text" size="small" :disabled="disabled || model === null || model === undefined" @click="clear" />
                    </slot>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>
