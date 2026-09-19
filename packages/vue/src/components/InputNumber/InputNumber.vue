<script setup lang="ts">
import { clamp, createNumberFormat, stepValue } from '@vitral/core';
import { inputnumberStyle } from '@vitral/styles';
import { computed, mergeProps, onBeforeUnmount, ref, useId, watch } from 'vue';
import { useComponent, useSplitAttrs } from '../../base/useComponent';
import Icon from '../Icon/Icon.vue';
import type { InputNumberEmits, InputNumberProps } from './types';
import { keepFocus } from '../../base/press';

// The WAI-ARIA spinbutton on a text box. The text is free while it is being
// edited: it is read back as a number on every keystroke, so the value the
// spinbutton announces follows the typing, and it is committed, clamped and
// formatted on blur or Enter. Arrows and the spin buttons commit at once.

defineOptions({ name: 'VtInputNumber', inheritAttrs: false });

const props = withDefaults(defineProps<InputNumberProps>(), {
    unstyled: undefined,
    variant: undefined,
    step: 1,
    mode: 'decimal',
    useGrouping: true,
    allowEmpty: true,
    buttonLayout: 'stacked'
});
const model = defineModel<number | null>();
const emit = defineEmits<InputNumberEmits>();

const { part, config, locale: vtLocale } = useComponent(inputnumberStyle, props);
const { rootAttrs, controlAttrs } = useSplitAttrs();
const inputRef = ref<HTMLInputElement | null>(null);
const generatedId = useId();
const inputId = computed(() => (controlAttrs.value.id as string | undefined) ?? generatedId);

const formatter = computed(() =>
    createNumberFormat({
        locale: props.locale ?? vtLocale.value.code,
        // Intl refuses a currency format without a currency; show a plain number rather than throw.
        mode: props.mode === 'currency' && !props.currency ? 'decimal' : props.mode,
        currency: props.currency,
        minFractionDigits: props.minFractionDigits,
        maxFractionDigits: props.maxFractionDigits,
        useGrouping: props.useGrouping,
        prefix: props.prefix,
        suffix: props.suffix
    })
);

/** What the box shows; free text while `dirty`, the formatted value otherwise. */
const text = ref('');
const dirty = ref(false);
/** The typed text read as a number. */
const typed = ref<number | null>(null);
const current = computed<number | null>(() => (dirty.value ? typed.value : (model.value ?? null)));

watch(
    [() => model.value, formatter],
    () => {
        if (!dirty.value) text.value = formatter.value.format(model.value);
    },
    { immediate: true }
);

const state = computed(() => ({
    size: props.size,
    variant: props.variant ?? config.inputVariant,
    invalid: props.invalid,
    disabled: props.disabled,
    readonly: props.readonly,
    fluid: props.fluid,
    showButtons: props.showButtons,
    buttonLayout: props.buttonLayout
}));

const editable = computed(() => !props.disabled && !props.readonly);
const canIncrement = computed(() => editable.value && (props.max === undefined || current.value === null || current.value < props.max));
const canDecrement = computed(() => editable.value && (props.min === undefined || current.value === null || current.value > props.min));
const valueText = computed(() => (current.value === null ? undefined : formatter.value.format(current.value)));

/** Clamped, and rounded to what the format shows, so the value is never more precise than its text. */
function settle(value: number): number {
    const clamped = clamp(value, props.min, props.max);
    const shown = formatter.value.parse(formatter.value.format(clamped));
    return shown === null ? clamped : clamp(shown, props.min, props.max);
}

function setValue(next: number | null) {
    dirty.value = false;
    typed.value = null;
    text.value = formatter.value.format(next);
    if (next !== (model.value ?? null)) model.value = next;
}

function commit() {
    if (!dirty.value) {
        text.value = formatter.value.format(model.value);
        return;
    }
    const fallback = () => model.value ?? settle(clamp(0, props.min, props.max));
    let next: number | null;
    if (text.value.trim() === '') next = props.allowEmpty ? null : fallback();
    // Text with no number in it: keep the value it had.
    else if (typed.value === null) next = model.value ?? null;
    else next = settle(typed.value);
    setValue(next);
}

/** One step (times `multiplier`) up or down from what is shown; true when the value moved. */
function spin(direction: 1 | -1, multiplier = 1, event?: Event): boolean {
    if (!editable.value) return false;
    const before = current.value;
    const next = settle(stepValue(before, props.step * multiplier, direction, props.min, props.max));
    const moved = next !== before;
    if (moved) emit('input', { originalEvent: event, value: next });
    setValue(next);
    return moved;
}

function jumpTo(bound: number, event: Event) {
    const next = settle(bound);
    if (next !== current.value) emit('input', { originalEvent: event, value: next });
    setValue(next);
}

function onInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    text.value = value;
    dirty.value = true;
    typed.value = formatter.value.parse(value);
    emit('input', { originalEvent: event, value: typed.value });
}

function onKeydown(event: KeyboardEvent) {
    if (!editable.value) return;
    switch (event.key) {
        case 'ArrowUp':
            event.preventDefault();
            spin(1, 1, event);
            break;
        case 'ArrowDown':
            event.preventDefault();
            spin(-1, 1, event);
            break;
        case 'PageUp':
            event.preventDefault();
            spin(1, 10, event);
            break;
        case 'PageDown':
            event.preventDefault();
            spin(-1, 10, event);
            break;
        // Without a bound, Home and End keep moving the caret.
        case 'Home':
            if (props.min !== undefined) {
                event.preventDefault();
                jumpTo(props.min, event);
            }
            break;
        case 'End':
            if (props.max !== undefined) {
                event.preventDefault();
                jumpTo(props.max, event);
            }
            break;
        case 'Enter':
            commit();
            break;
    }
}

function onBlur(event: FocusEvent) {
    commit();
    emit('blur', event);
}

// ---- spin buttons: step on press, then repeat while held -------------------

let timer: ReturnType<typeof setTimeout> | undefined;

function stopRepeat() {
    clearTimeout(timer);
    timer = undefined;
    document.removeEventListener('pointerup', stopRepeat);
    document.removeEventListener('pointercancel', stopRepeat);
}

function onButtonPointerdown(event: PointerEvent, direction: 1 | -1) {
    if (event.button !== 0 || !editable.value) return;
    stopRepeat();
    inputRef.value?.focus();
    if (!spin(direction, 1, event)) return;
    const repeat = (delay: number) => {
        timer = setTimeout(() => (spin(direction) ? repeat(50) : stopRepeat()), delay);
    };
    repeat(400);
    document.addEventListener('pointerup', stopRepeat);
    document.addEventListener('pointercancel', stopRepeat);
}

// The pointer already stepped on press; a click with no pointer behind it
// (detail 0) comes from assistive technology, and steps once.
function onButtonClick(event: MouseEvent, direction: 1 | -1) {
    if (event.detail === 0) spin(direction, 1, event);
}

onBeforeUnmount(stopRepeat);

// A press on the field's padding focuses the text, as it does on a native text box.
function onRootPointerdown(event: PointerEvent) {
    const target = event.target as Element;
    if (target === inputRef.value) return;
    keepFocus(event);
    if (!target.closest('button')) inputRef.value?.focus();
}

defineExpose({ focus: () => inputRef.value?.focus(), blur: () => inputRef.value?.blur(), input: inputRef });
</script>

<template>
    <div v-bind="mergeProps(rootAttrs, part('root', state))" @pointerdown="onRootPointerdown">
        <button
            v-if="showButtons && buttonLayout === 'horizontal'"
            type="button"
            tabindex="-1"
            :aria-label="vtLocale.aria.decrement"
            :aria-controls="inputId"
            :disabled="!canDecrement"
            v-bind="part('decrementButton')"
            @pointerdown="onButtonPointerdown($event, -1)"
            @pointerleave="stopRepeat"
            @click="onButtonClick($event, -1)"
        >
            <Icon icon="minus" />
        </button>
        <input
            ref="inputRef"
            v-bind="mergeProps(controlAttrs, part('input'))"
            :id="inputId"
            type="text"
            role="spinbutton"
            inputmode="decimal"
            autocomplete="off"
            :value="text"
            :disabled="disabled"
            :readonly="readonly"
            :aria-valuenow="current ?? undefined"
            :aria-valuemin="min"
            :aria-valuemax="max"
            :aria-valuetext="valueText"
            :aria-invalid="invalid ? 'true' : undefined"
            @input="onInput"
            @keydown="onKeydown"
            @focus="emit('focus', $event)"
            @blur="onBlur"
        />
        <button
            v-if="showButtons && buttonLayout === 'horizontal'"
            type="button"
            tabindex="-1"
            :aria-label="vtLocale.aria.increment"
            :aria-controls="inputId"
            :disabled="!canIncrement"
            v-bind="part('incrementButton')"
            @pointerdown="onButtonPointerdown($event, 1)"
            @pointerleave="stopRepeat"
            @click="onButtonClick($event, 1)"
        >
            <Icon icon="plus" />
        </button>
        <span v-if="showButtons && buttonLayout !== 'horizontal'" v-bind="part('spinner')">
            <button
                type="button"
                tabindex="-1"
                :aria-label="vtLocale.aria.increment"
                :aria-controls="inputId"
                :disabled="!canIncrement"
                v-bind="part('incrementButton')"
                @pointerdown="onButtonPointerdown($event, 1)"
                @pointerleave="stopRepeat"
                @click="onButtonClick($event, 1)"
            >
                <Icon icon="chevronUp" />
            </button>
            <button
                type="button"
                tabindex="-1"
                :aria-label="vtLocale.aria.decrement"
                :aria-controls="inputId"
                :disabled="!canDecrement"
                v-bind="part('decrementButton')"
                @pointerdown="onButtonPointerdown($event, -1)"
                @pointerleave="stopRepeat"
                @click="onButtonClick($event, -1)"
            >
                <Icon icon="chevronDown" />
            </button>
        </span>
    </div>
</template>
