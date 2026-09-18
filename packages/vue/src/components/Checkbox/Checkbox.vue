<script setup lang="ts">
import { equals } from '@vitral/core';
import { checkboxStyle } from '@vitral/styles';
import { computed, mergeProps, ref, useId, watchEffect } from 'vue';
import { useComponent, useSplitAttrs } from '../../base/useComponent';
import Icon from '../Icon/Icon.vue';
import type { CheckboxEmits, CheckboxProps, CheckboxSlots } from './types';

// A real <input type="checkbox">, transparent over a drawn box, so a form
// submits it, a <label> toggles it, Space works, and a screen reader hears a
// checkbox, including "mixed", from the DOM `indeterminate` property.

defineOptions({ name: 'VtCheckbox', inheritAttrs: false });

const props = withDefaults(defineProps<CheckboxProps>(), { unstyled: undefined, trueValue: true, falseValue: false });
const model = defineModel<unknown>();
/** The mixed state; cleared by the next toggle, as the native one is. */
const indeterminate = defineModel<boolean>('indeterminate', { default: false });
const emit = defineEmits<CheckboxEmits>();
defineSlots<CheckboxSlots>();

const { part } = useComponent(checkboxStyle, props);
const { rootAttrs, controlAttrs } = useSplitAttrs();
const inputRef = ref<HTMLInputElement | null>(null);
const generatedId = useId();
const inputId = computed(() => (controlAttrs.value.id as string | undefined) ?? generatedId);

const binary = computed(() => props.binary || props.value === undefined);
const checked = computed(() => {
    if (binary.value) return equals(model.value, props.trueValue);
    return Array.isArray(model.value) && model.value.some((item) => equals(item, props.value));
});

const state = computed(() => ({ checked: checked.value, indeterminate: indeterminate.value, invalid: props.invalid, disabled: props.disabled, size: props.size }));

watchEffect(
    () => {
        if (inputRef.value) inputRef.value.indeterminate = indeterminate.value;
    },
    { flush: 'post' }
);

function onChange(event: Event) {
    const next = !checked.value;
    let value: unknown;
    if (binary.value) value = next ? props.trueValue : props.falseValue;
    else {
        const list = Array.isArray(model.value) ? model.value : [];
        value = next ? [...list, props.value] : list.filter((item) => !equals(item, props.value));
    }
    model.value = value;
    indeterminate.value = false;
    // Until the parent re-renders, keep the box showing what v-model says rather than what was clicked.
    (event.target as HTMLInputElement).checked = checked.value;
    emit('change', { originalEvent: event, checked: next, value });
}

// There is no read-only checkbox in HTML; refuse the toggle before the browser makes it.
function onClick(event: MouseEvent) {
    if (props.readonly) event.preventDefault();
}

defineExpose({ focus: () => inputRef.value?.focus(), blur: () => inputRef.value?.blur(), input: inputRef });
</script>

<template>
    <div v-bind="mergeProps(rootAttrs, part('root', state))">
        <span v-bind="part('control')">
            <input
                ref="inputRef"
                v-bind="mergeProps(controlAttrs, part('input'))"
                :id="inputId"
                type="checkbox"
                :value="binary || typeof value === 'object' ? undefined : value"
                :checked="checked"
                :disabled="disabled"
                :aria-readonly="readonly ? 'true' : undefined"
                :aria-invalid="invalid ? 'true' : undefined"
                @click="onClick"
                @change="onChange"
                @focus="emit('focus', $event)"
                @blur="emit('blur', $event)"
            />
            <span v-bind="part('box')">
                <slot name="icon" :checked="checked" :indeterminate="indeterminate">
                    <Icon v-if="indeterminate" icon="minus" v-bind="part('icon')" />
                    <Icon v-else-if="checked" icon="check" v-bind="part('icon')" />
                </slot>
            </span>
        </span>
        <label v-if="label || $slots.default" :for="inputId" v-bind="part('label')">
            <slot>{{ label }}</slot>
        </label>
    </div>
</template>
