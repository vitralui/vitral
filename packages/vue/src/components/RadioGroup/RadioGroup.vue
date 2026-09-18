<script setup lang="ts">
import { radiogroupStyle } from '@vitral/styles';
import { computed, provide, useId } from 'vue';
import { useComponent } from '../../base/useComponent';
import { RadioGroupKey } from './context';
import type { RadioGroupEmits, RadioGroupProps, RadioGroupSlots } from './types';

// The WAI-ARIA radio group, built on native radios: the group gives them one
// name, so the browser already moves and checks with the arrow keys and keeps
// a single tab stop. The group is named by `aria-labelledby` or `aria-label`,
// which fall through to this element.

defineOptions({ name: 'VtRadioGroup' });

const props = withDefaults(defineProps<RadioGroupProps>(), { unstyled: undefined, orientation: 'vertical' });
const model = defineModel<unknown>();
const emit = defineEmits<RadioGroupEmits>();
defineSlots<RadioGroupSlots>();

const { part } = useComponent(radiogroupStyle, props);
const id = useId();

provide(RadioGroupKey, {
    name: computed(() => props.name ?? `${id}-radio`),
    modelValue: computed(() => model.value),
    disabled: computed(() => props.disabled),
    invalid: computed(() => props.invalid),
    size: computed(() => props.size),
    select(value, event) {
        model.value = value;
        emit('change', { originalEvent: event, value });
    }
});
</script>

<template>
    <div role="radiogroup" v-bind="part('root', { orientation })" :aria-orientation="orientation" :aria-invalid="invalid ? 'true' : undefined">
        <slot />
    </div>
</template>
