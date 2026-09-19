<script setup lang="ts">
import {
    defaultMaskDefinitions,
    isMaskComplete,
    isMaskEmpty,
    isPrintableKey,
    maskCaret,
    maskDelete,
    maskInsert,
    parseMask,
    parseMaskText,
    renderMask,
    unmaskValue,
    type MaskEdit,
    type MaskSlots
} from '@vitral/core';
import { inputmaskStyle } from '@vitral/styles';
import { computed, mergeProps, nextTick, ref, shallowRef, watch } from 'vue';
import { useComponent, useSplitAttrs } from '../../base/useComponent';
import type { InputMaskEmits, InputMaskProps } from './types';
import { keepFocus } from '../../base/press';

// A native text box that types into a pattern. Keystrokes, deletions and pastes
// are taken over and handed to core's mask arithmetic, which says what the
// slots hold and where the caret goes; anything that still reaches the box
// another way (autofill, an input method) is read back through the same
// arithmetic. The box stays a plain textbox for assistive technology, and the
// pattern is what it reads out, character by character.

defineOptions({ name: 'VtInputMask', inheritAttrs: false });

const props = withDefaults(defineProps<InputMaskProps>(), { unstyled: undefined, variant: undefined, slotChar: '_', autoClear: true });
const model = defineModel<string | null>();
const emit = defineEmits<InputMaskEmits>();

const { part, config } = useComponent(inputmaskStyle, props);
const { rootAttrs, controlAttrs } = useSplitAttrs();
const inputRef = ref<HTMLInputElement | null>(null);

const tokens = computed(() => parseMask(props.mask, { ...defaultMaskDefinitions, ...props.definitions }));
const slots = shallowRef<MaskSlots>([]);
const focused = ref(false);
let emitted: string | null | undefined;

const empty = computed(() => isMaskEmpty(tokens.value, slots.value));
const text = computed(() => (focused.value || !empty.value ? renderMask(tokens.value, slots.value, props.slotChar) : ''));
const numeric = computed(() => tokens.value.every((token) => !token.test || token.test === defaultMaskDefinitions['9']));

const state = computed(() => ({
    size: props.size,
    variant: props.variant ?? config.inputVariant,
    invalid: props.invalid,
    disabled: props.disabled,
    readonly: props.readonly,
    fluid: props.fluid
}));

function valueOf(next: MaskSlots): string {
    if (isMaskEmpty(tokens.value, next)) return '';
    return props.unmask ? unmaskValue(tokens.value, next) : renderMask(tokens.value, next, props.slotChar);
}

// A value set from outside is read into the slots; our own echo is left alone.
watch(
    [() => model.value, tokens],
    ([value]) => {
        if (value === emitted && slots.value.length === tokens.value.length) return;
        slots.value = parseMaskText(tokens.value, value, props.slotChar);
    },
    { immediate: true }
);

function placeCaret(position: number) {
    nextTick(() => {
        const el = inputRef.value;
        if (el && document.activeElement === el) el.setSelectionRange(position, position);
    });
}

function apply(edit: MaskEdit, event: Event) {
    const wasComplete = isMaskComplete(tokens.value, slots.value);
    slots.value = edit.slots;
    const el = inputRef.value;
    if (el) el.value = text.value;
    placeCaret(edit.caret);
    const value = valueOf(edit.slots);
    if (value !== (model.value ?? '')) {
        emitted = value;
        model.value = value;
    }
    if (!wasComplete && isMaskComplete(tokens.value, edit.slots)) emit('complete', { originalEvent: event, value });
}

function selection(): [number, number] {
    const el = inputRef.value;
    return [el?.selectionStart ?? 0, el?.selectionEnd ?? 0];
}

function onKeydown(event: KeyboardEvent) {
    if (props.disabled || props.readonly) return;
    const [start, end] = selection();
    if (event.key === 'Backspace' || event.key === 'Delete') {
        event.preventDefault();
        apply(maskDelete(tokens.value, slots.value, start, end, event.key === 'Backspace' ? 'backward' : 'forward'), event);
    } else if (isPrintableKey(event)) {
        event.preventDefault();
        apply(maskInsert(tokens.value, slots.value, start, end, event.key), event);
    }
}

function onPaste(event: ClipboardEvent) {
    if (props.disabled || props.readonly) return;
    event.preventDefault();
    const [start, end] = selection();
    apply(maskInsert(tokens.value, slots.value, start, end, event.clipboardData?.getData('text') ?? ''), event);
}

// Whatever got past keydown: autofill, an input method, a drop.
function onInput(event: Event) {
    const next = parseMaskText(tokens.value, (event.target as HTMLInputElement).value, props.slotChar);
    apply({ slots: next, caret: maskCaret(tokens.value, next) }, event);
}

function onFocus(event: FocusEvent) {
    focused.value = true;
    if (!props.readonly) placeCaret(maskCaret(tokens.value, slots.value));
    emit('focus', event);
}

function onBlur(event: FocusEvent) {
    focused.value = false;
    if (props.autoClear && !empty.value && !isMaskComplete(tokens.value, slots.value)) {
        apply({ slots: parseMaskText(tokens.value, ''), caret: 0 }, event);
    }
    emit('blur', event);
}

function onRootPointerdown(event: PointerEvent) {
    if (event.target === inputRef.value) return;
    keepFocus(event);
    inputRef.value?.focus();
}

defineExpose({ focus: () => inputRef.value?.focus(), blur: () => inputRef.value?.blur(), input: inputRef });
</script>

<template>
    <div v-bind="mergeProps(rootAttrs, part('root', state))" @pointerdown="onRootPointerdown">
        <input
            ref="inputRef"
            v-bind="mergeProps(controlAttrs, part('input'))"
            type="text"
            :inputmode="numeric ? 'numeric' : undefined"
            :value="text"
            :disabled="disabled"
            :readonly="readonly"
            :aria-invalid="invalid ? 'true' : undefined"
            @keydown="onKeydown"
            @paste="onPaste"
            @input="onInput"
            @focus="onFocus"
            @blur="onBlur"
        />
    </div>
</template>
