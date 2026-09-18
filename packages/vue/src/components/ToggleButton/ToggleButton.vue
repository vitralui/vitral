<script setup lang="ts">
import { togglebuttonStyle } from '@vitral/styles';
import { computed } from 'vue';
import { useComponent } from '../../base/useComponent';
import Icon from '../Icon/Icon.vue';
import type { ToggleButtonEmits, ToggleButtonProps, ToggleButtonSlots } from './types';

// A button that stays pressed: aria-pressed, not a checkbox, because it is a
// command whose effect persists rather than a value in a form. Its name does
// not change with its state — "Bold" pressed and "Bold" not pressed — so a
// reader hears the same control rather than a new one.

defineOptions({ name: 'VtToggleButton' });

const props = withDefaults(defineProps<ToggleButtonProps>(), { unstyled: undefined });
const model = defineModel<boolean>({ default: false });
const emit = defineEmits<ToggleButtonEmits>();
defineSlots<ToggleButtonSlots>();

const { part } = useComponent(togglebuttonStyle, props);

const state = computed(() => ({ checked: model.value, size: props.size, invalid: props.invalid, fluid: props.fluid }));
const icon = computed(() => (model.value ? (props.onIcon ?? props.offIcon) : (props.offIcon ?? props.onIcon)));
const label = computed(() => (model.value ? props.onLabel : props.offLabel) ?? props.offLabel ?? props.onLabel);

function toggle(event: Event) {
    const next = !model.value;
    model.value = next;
    emit('change', { originalEvent: event, value: next });
}
</script>

<template>
    <button type="button" :aria-pressed="model ? 'true' : 'false'" :disabled="disabled" v-bind="part('root', state)" @click="toggle">
        <slot name="icon" :checked="model">
            <Icon v-if="icon" :icon="icon" v-bind="part('icon')" />
        </slot>
        <span v-if="label || $slots.default" v-bind="part('label')">
            <slot :checked="model">{{ label }}</slot>
        </span>
    </button>
</template>
