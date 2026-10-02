<script setup lang="ts">
import { inputmaskStyle } from '@vitral/styles';
import { computed, mergeProps, ref } from 'vue';
import { useComponent, useSplitAttrs } from '../../base/useComponent';
import { useMask } from '../../base/useMask';
import type { InputMaskEmits, InputMaskProps } from './types';
import { keepFocus } from '../../base/press';

// A native text box that types into a pattern. The typing is useMask's, the
// same as InputText's with a `mask`, so a mask behaves alike in either. The
// box stays a plain textbox for assistive technology, and the pattern is what
// it reads out, character by character.

defineOptions({ name: 'VtInputMask', inheritAttrs: false });

const props = withDefaults(defineProps<InputMaskProps>(), {
    unstyled: undefined,
    variant: undefined,
    // Absent, not false: an unset setting leaves the one in a mask object.
    unmask: undefined,
    autoClear: undefined
});
const model = defineModel<string | null>();
const emit = defineEmits<InputMaskEmits>();

const { part, config } = useComponent(inputmaskStyle, props);
const { rootAttrs, controlAttrs } = useSplitAttrs();
const inputRef = ref<HTMLInputElement | null>(null);

const mask = useMask({
    input: inputRef,
    mask: () => props.mask,
    settings: () => ({ unmask: props.unmask, slotChar: props.slotChar, autoClear: props.autoClear, definitions: props.definitions }),
    value: () => model.value,
    onValue: (value) => (model.value = value),
    onComplete: (value, event) => emit('complete', { originalEvent: event, value }),
    editable: () => !props.disabled && !props.readonly
});

const state = computed(() => ({
    size: props.size,
    variant: props.variant ?? config.inputVariant,
    invalid: props.invalid,
    disabled: props.disabled,
    readonly: props.readonly,
    fluid: props.fluid
}));

// Without a mask it is a plain text box, as InputText is.
function onInput(event: Event) {
    if (mask.active.value) mask.onInput(event);
    else model.value = (event.target as HTMLInputElement).value;
}

function onFocus(event: FocusEvent) {
    mask.onFocus();
    emit('focus', event);
}

function onBlur(event: FocusEvent) {
    mask.onBlur(event);
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
            :inputmode="mask.inputmode(controlAttrs.inputmode)"
            :value="mask.active.value ? mask.text.value : (model ?? '')"
            :disabled="disabled"
            :readonly="readonly"
            :aria-invalid="invalid ? 'true' : undefined"
            @keydown="mask.onKeydown"
            @paste="mask.onPaste"
            @input="onInput"
            @focus="onFocus"
            @blur="onBlur"
        />
    </div>
</template>
