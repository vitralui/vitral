<script setup lang="ts">
import { inputtextStyle } from '@vitral/styles';
import { computed, mergeProps, ref } from 'vue';
import { useComponent, useSplitAttrs } from '../../base/useComponent';
import Icon from '../Icon/Icon.vue';
import type { InputTextProps, InputTextSlots } from './types';
import { keepFocus } from '../../base/press';

defineOptions({ name: 'VtInputText', inheritAttrs: false });

const props = withDefaults(defineProps<InputTextProps>(), { unstyled: undefined, variant: undefined, type: 'text' });
const model = defineModel<string | null>();
const emit = defineEmits<{ clear: [] }>();
defineSlots<InputTextSlots>();

const { part, config, locale } = useComponent(inputtextStyle, props);
const { rootAttrs, controlAttrs } = useSplitAttrs();
const inputRef = ref<HTMLInputElement | null>(null);

const state = computed(() => ({
    size: props.size,
    variant: props.variant ?? config.inputVariant,
    invalid: props.invalid,
    disabled: props.disabled,
    readonly: props.readonly,
    fluid: props.fluid
}));

const showClear = computed(() => props.clearable && !!model.value && !props.disabled && !props.readonly);

function onInput(event: Event) {
    model.value = (event.target as HTMLInputElement).value;
}

function clear() {
    model.value = '';
    emit('clear');
    inputRef.value?.focus();
}

// A press on the field's padding or on an adornment focuses the text, as a
// press anywhere on a native text box does.
function onRootPointerdown(event: PointerEvent) {
    const target = event.target as Element;
    if (target === inputRef.value || target.closest('button')) return;
    // Not prevented for a finger: the tap has to survive. The focus it was
    // taking is moved here either way.
    keepFocus(event);
    inputRef.value?.focus();
}

defineExpose({ focus: () => inputRef.value?.focus(), blur: () => inputRef.value?.blur(), input: inputRef });
</script>

<template>
    <div v-bind="mergeProps(rootAttrs, part('root', state))" @pointerdown="onRootPointerdown">
        <span v-if="$slots.prefix" v-bind="part('prefix')"><slot name="prefix" /></span>
        <input
            ref="inputRef"
            v-bind="mergeProps(controlAttrs, part('input'))"
            :type="type"
            :value="model ?? ''"
            :disabled="disabled"
            :readonly="readonly"
            :aria-invalid="invalid ? 'true' : undefined"
            @input="onInput"
        />
        <button v-if="showClear" type="button" tabindex="-1" :aria-label="locale.clear" v-bind="part('clear')" @click="clear">
            <Icon icon="x" />
        </button>
        <span v-if="$slots.suffix" v-bind="part('suffix')"><slot name="suffix" /></span>
    </div>
</template>
