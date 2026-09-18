<script setup lang="ts">
import { equals } from '@vitral/core';
import { radiobuttonStyle } from '@vitral/styles';
import { computed, inject, mergeProps, ref, useId } from 'vue';
import { useComponent, useSplitAttrs } from '../../base/useComponent';
import { RadioGroupKey } from '../RadioGroup/context';
import type { RadioButtonEmits, RadioButtonProps, RadioButtonSlots } from './types';

// A real <input type="radio">, transparent over a drawn ring. Inside a
// RadioGroup it takes the group's name and v-model; on its own it has both.

defineOptions({ name: 'VtRadioButton', inheritAttrs: false });

const props = withDefaults(defineProps<RadioButtonProps>(), { unstyled: undefined });
const model = defineModel<unknown>();
const emit = defineEmits<RadioButtonEmits>();
defineSlots<RadioButtonSlots>();

const group = inject(RadioGroupKey, null);
const { part } = useComponent(radiobuttonStyle, props);
const { rootAttrs, controlAttrs } = useSplitAttrs();
const inputRef = ref<HTMLInputElement | null>(null);
const generatedId = useId();
const inputId = computed(() => (controlAttrs.value.id as string | undefined) ?? generatedId);

const selected = computed(() => (group ? group.modelValue.value : model.value));
const checked = computed(() => selected.value !== undefined && selected.value !== null && equals(selected.value, props.value));
const name = computed(() => props.name ?? group?.name.value);
const disabled = computed(() => props.disabled || !!group?.disabled.value);
const invalid = computed(() => props.invalid || !!group?.invalid.value);
const size = computed(() => props.size ?? group?.size.value);
/** A form submits the value attribute; only a primitive has a meaningful one. */
const nativeValue = computed(() => (props.value === null || typeof props.value === 'object' ? undefined : String(props.value)));

const state = computed(() => ({ checked: checked.value, invalid: invalid.value, disabled: disabled.value, size: size.value }));

function onChange(event: Event) {
    if (checked.value) return;
    if (group) group.select(props.value, event);
    else model.value = props.value;
    emit('change', { originalEvent: event, value: props.value });
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
                type="radio"
                :name="name"
                :value="nativeValue"
                :checked="checked"
                :disabled="disabled"
                :aria-invalid="invalid && !group ? 'true' : undefined"
                @change="onChange"
                @focus="emit('focus', $event)"
                @blur="emit('blur', $event)"
            />
            <span v-bind="part('box')">
                <span v-bind="part('dot')" />
            </span>
        </span>
        <label v-if="label || $slots.default" :for="inputId" v-bind="part('label')">
            <slot>{{ label }}</slot>
        </label>
    </div>
</template>
