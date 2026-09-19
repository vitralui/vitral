<script setup lang="ts">
import { passwordStrength } from '@vitral/core';
import { inputpasswordStyle } from '@vitral/styles';
import { computed, mergeProps, ref, useId } from 'vue';
import { useComponent, useSplitAttrs } from '../../base/useComponent';
import { useOverlay } from '../../composables/useOverlay';
import Icon from '../Icon/Icon.vue';
import type { InputPasswordEmits, InputPasswordProps, InputPasswordSlots } from './types';
import { useOverlayTarget } from '../../composables/useOverlayTarget';
import { keepFocus } from '../../base/press';

// A native password box. The reveal button is a real button in the tab order
// whose name says what pressing it will do. The strength meter opens beside the
// box while it has focus; its label is a polite live region and describes the
// box, so the grade is heard as it changes without moving focus anywhere.

defineOptions({ name: 'VtInputPassword', inheritAttrs: false });

const props = withDefaults(defineProps<InputPasswordProps>(), {
    unstyled: undefined,
    variant: undefined,
    feedback: true,
    placement: 'bottom-start',
    appendTo: 'body'
});
const overlayTarget = useOverlayTarget(() => props.appendTo);
const model = defineModel<string | null>();
const emit = defineEmits<InputPasswordEmits>();
defineSlots<InputPasswordSlots>();

const { part, config, locale } = useComponent(inputpasswordStyle, props);
const { rootAttrs, controlAttrs } = useSplitAttrs();
const infoId = `${useId()}-strength`;

const rootRef = ref<HTMLElement | null>(null);
const inputRef = ref<HTMLInputElement | null>(null);
const overlayRef = ref<HTMLElement | null>(null);
const focused = ref(false);
const unmasked = ref(false);

const state = computed(() => ({
    size: props.size,
    variant: props.variant ?? config.inputVariant,
    invalid: props.invalid,
    disabled: props.disabled,
    readonly: props.readonly,
    fluid: props.fluid
}));

const strength = computed(() => passwordStrength(model.value, { mediumRegex: props.mediumRegex, strongRegex: props.strongRegex }));
const strengthLabel = computed(() => {
    switch (strength.value) {
        case 'strong':
            return props.strongLabel ?? locale.value.strong;
        case 'medium':
            return props.mediumLabel ?? locale.value.medium;
        case 'weak':
            return props.weakLabel ?? locale.value.weak;
        default:
            return props.promptLabel ?? locale.value.passwordPrompt;
    }
});

const open = computed(() => props.feedback && focused.value && !props.disabled && !props.readonly);
const showClear = computed(() => props.clearable && !!model.value && !props.disabled && !props.readonly);
const describedBy = computed(() => [controlAttrs.value['aria-describedby'], open.value ? infoId : undefined].filter(Boolean).join(' ') || undefined);

useOverlay({ anchor: rootRef, overlay: overlayRef, placement: () => props.placement });

function onInput(event: Event) {
    model.value = (event.target as HTMLInputElement).value;
}

function onFocus(event: FocusEvent) {
    focused.value = true;
    emit('focus', event);
}

function onBlur(event: FocusEvent) {
    focused.value = false;
    emit('blur', event);
}

function clear() {
    model.value = '';
    emit('clear');
    inputRef.value?.focus();
}

// A press on the field's padding focuses the text, as on a native text box;
// a press on a button inside keeps its own focus.
function onRootPointerdown(event: PointerEvent) {
    const target = event.target as Element;
    if (target === inputRef.value || target.closest('button')) return;
    keepFocus(event);
    inputRef.value?.focus();
}

defineExpose({ focus: () => inputRef.value?.focus(), blur: () => inputRef.value?.blur(), input: inputRef });
</script>

<template>
    <div ref="rootRef" v-bind="mergeProps(rootAttrs, part('root', state))" @pointerdown="onRootPointerdown">
        <input
            ref="inputRef"
            v-bind="mergeProps(controlAttrs, part('input'))"
            :type="unmasked ? 'text' : 'password'"
            :value="model ?? ''"
            :disabled="disabled"
            :readonly="readonly"
            :aria-invalid="invalid ? 'true' : undefined"
            :aria-describedby="describedBy"
            @input="onInput"
            @focus="onFocus"
            @blur="onBlur"
        />
        <button v-if="showClear" type="button" tabindex="-1" :aria-label="locale.clear" v-bind="part('clear')" @click="clear">
            <Icon icon="x" />
        </button>
        <button
            v-if="toggleMask"
            type="button"
            :disabled="disabled"
            :aria-label="unmasked ? locale.aria.hidePassword : locale.aria.showPassword"
            v-bind="part('reveal')"
            @click="unmasked = !unmasked"
        >
            <slot v-if="unmasked" name="unmaskicon"><Icon icon="eyeOff" /></slot>
            <slot v-else name="maskicon"><Icon icon="eye" /></slot>
        </button>
    </div>
    <Teleport :to="overlayTarget" :disabled="appendTo === 'self'">
        <Transition name="vt-overlay">
            <div v-if="open" ref="overlayRef" v-bind="part('overlay')" @pointerdown="keepFocus">
                <slot name="header" />
                <slot name="content" :strength="strength" :label="strengthLabel">
                    <div v-bind="part('meter')" aria-hidden="true">
                        <div v-bind="part('meterLabel', { strength })" />
                    </div>
                </slot>
                <div :id="infoId" role="status" aria-live="polite" v-bind="part('info')">{{ strengthLabel }}</div>
                <slot name="footer" />
            </div>
        </Transition>
    </Teleport>
</template>
