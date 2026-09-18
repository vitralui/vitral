<script setup lang="ts">
import { formatMessage, isOtpChar, isPrintableKey, otpBackspace, otpBoxes, otpFill, type OtpEdit } from '@vitral/core';
import { inputotpStyle } from '@vitral/styles';
import { computed, mergeProps, nextTick, onMounted, ref, useAttrs, useId } from 'vue';
import { useComponent } from '../../base/useComponent';
import type { InputOtpEmits, InputOtpProps, InputOtpSlots } from './types';

// One native text box per character, in a group. Each box is named by its
// position ("character 2 of 6"); the group carries the name of the whole code,
// from `aria-label`, `aria-labelledby`, or the <label for> pointed at the `id`,
// which lands on the first box. Typing moves on, Backspace moves back, the
// arrows walk the boxes, and a pasted or autofilled code fills them all.

defineOptions({ name: 'VtInputOtp', inheritAttrs: false });

const props = withDefaults(defineProps<InputOtpProps>(), { unstyled: undefined, variant: undefined, length: 4 });
const model = defineModel<string | null>();
const emit = defineEmits<InputOtpEmits>();
defineSlots<InputOtpSlots>();

const { part, config, locale } = useComponent(inputotpStyle, props);
const attrs = useAttrs();
const autoId = useId();
const rootRef = ref<HTMLElement | null>(null);
// Read from the DOM rather than from refs, so boxes rendered by the slot count too.
const inputs = () => Array.from(rootRef.value?.querySelectorAll('input') ?? []);

const firstId = computed(() => (attrs.id as string | undefined) ?? `${autoId}-0`);
const groupAttrs = computed(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, ...rest } = attrs;
    return rest;
});
const labelFromFor = ref<string>();
const groupLabelledBy = computed(() => (attrs['aria-labelledby'] as string | undefined) ?? (attrs['aria-label'] ? undefined : labelFromFor.value));

const boxes = computed(() => otpBoxes(model.value, props.length));
const editable = computed(() => !props.disabled && !props.readonly);
const fieldState = computed(() => ({
    size: props.size,
    variant: props.variant ?? config.inputVariant,
    invalid: props.invalid,
    disabled: props.disabled,
    readonly: props.readonly
}));

// A <label for> names the first box by default; lend its name to the group,
// and let each box keep the name of its position.
onMounted(() => {
    const label = inputs()[0]?.labels?.[0];
    if (!label) return;
    label.id ||= `${autoId}-label`;
    labelFromFor.value = label.id;
});

function focusBox(index: number) {
    const el = inputs()[Math.max(0, Math.min(props.length - 1, index))];
    el?.focus();
    el?.select();
}

function apply(edit: OtpEdit, event: Event) {
    const value = edit.boxes.join('');
    const before = boxes.value.join('');
    // The box shows what the model says, even when the keystroke changed nothing.
    const els = inputs();
    edit.boxes.forEach((char, i) => {
        const el = els[i];
        if (el && el.value !== char) el.value = char;
    });
    if (value !== before) {
        model.value = value;
        emit('change', { originalEvent: event, value });
        if (edit.boxes.every(Boolean)) emit('complete', { originalEvent: event, value });
    }
    nextTick(() => focusBox(edit.focus));
}

function onInput(index: number, event: Event) {
    if (!editable.value) return;
    const el = event.target as HTMLInputElement;
    // What is new is what was not there before; an autofilled code arrives whole.
    const previous = boxes.value[index] ?? '';
    const text = el.value.length > 1 && el.value.startsWith(previous) && previous ? el.value.slice(previous.length) : el.value;
    if (text === '') apply({ boxes: boxes.value.map((c, i) => (i === index ? '' : c)), focus: index }, event);
    else apply(otpFill(boxes.value, index, text, props.integerOnly), event);
}

function onKeydown(index: number, event: KeyboardEvent) {
    switch (event.key) {
        case 'ArrowLeft':
        case 'ArrowRight': {
            event.preventDefault();
            const rtl = getComputedStyle(event.target as Element).direction === 'rtl';
            focusBox(index + ((event.key === 'ArrowRight') !== rtl ? 1 : -1));
            return;
        }
        case 'Home':
        case 'End':
            event.preventDefault();
            focusBox(event.key === 'Home' ? 0 : props.length - 1);
            return;
        case 'Backspace':
            if (!editable.value) return;
            event.preventDefault();
            apply(otpBackspace(boxes.value, index), event);
            return;
        case 'Delete':
            if (!editable.value) return;
            event.preventDefault();
            apply({ boxes: boxes.value.map((c, i) => (i === index ? '' : c)), focus: index }, event);
            return;
    }
    if (isPrintableKey(event)) {
        event.preventDefault();
        if (editable.value && isOtpChar(event.key, props.integerOnly)) apply(otpFill(boxes.value, index, event.key, props.integerOnly), event);
    }
}

function onPaste(index: number, event: ClipboardEvent) {
    event.preventDefault();
    if (!editable.value) return;
    apply(otpFill(boxes.value, index, event.clipboardData?.getData('text') ?? '', props.integerOnly), event);
}

function onFocus(event: FocusEvent) {
    (event.target as HTMLInputElement).select();
    emit('focus', event);
}

function boxAttrs(index: number) {
    return mergeProps(part('input'), {
        id: index === 0 ? firstId.value : `${autoId}-${index}`,
        type: props.mask ? 'password' : 'text',
        inputmode: props.integerOnly ? 'numeric' : 'text',
        autocomplete: index === 0 ? 'one-time-code' : 'off',
        maxlength: index === 0 ? undefined : 1,
        disabled: props.disabled,
        readonly: props.readonly,
        value: boxes.value[index],
        'aria-label': formatMessage(locale.value.aria.otpLabel, { index: index + 1, length: props.length }),
        'aria-invalid': props.invalid ? 'true' : undefined
    });
}

function boxEvents(index: number) {
    return {
        input: (event: Event) => onInput(index, event),
        keydown: (event: KeyboardEvent) => onKeydown(index, event),
        paste: (event: ClipboardEvent) => onPaste(index, event),
        focus: onFocus
    };
}

defineExpose({ focus: () => focusBox(0) });
</script>

<template>
    <div ref="rootRef" role="group" v-bind="mergeProps(groupAttrs, part('root'))" :aria-labelledby="groupLabelledBy">
        <template v-for="index in length" :key="index">
            <slot :index="index - 1" :value="boxes[index - 1]!" :attrs="boxAttrs(index - 1)" :events="boxEvents(index - 1)">
                <span v-bind="part('field', fieldState)">
                    <input
                        v-bind="boxAttrs(index - 1)"
                        @input="onInput(index - 1, $event)"
                        @keydown="onKeydown(index - 1, $event)"
                        @paste="onPaste(index - 1, $event)"
                        @focus="onFocus"
                        @blur="emit('blur', $event)"
                    />
                </span>
            </slot>
        </template>
    </div>
</template>
