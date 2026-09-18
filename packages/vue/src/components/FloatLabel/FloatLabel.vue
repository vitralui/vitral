<script setup lang="ts">
import { floatlabelStyle } from '@vitral/styles';
import { computed } from 'vue';
import { useComponent } from '../../base/useComponent';
import type { FloatLabelProps, FloatLabelSlots } from './types';

// The label is a real <label> the reader writes, pointed at the control with
// `for`: floating it is a visual arrangement, and nothing here touches the
// relation that makes the field usable. Whether it is lifted is read from the
// control's own state in CSS (`:focus-within`, `:placeholder-shown`), so a
// value set from code moves the label without an event to listen to.

defineOptions({ name: 'VtFloatLabel' });

const props = withDefaults(defineProps<FloatLabelProps>(), { unstyled: undefined, variant: 'over' });
defineSlots<FloatLabelSlots>();

const { part } = useComponent(floatlabelStyle, props);
const state = computed(() => ({ variant: props.variant, invalid: props.invalid, filled: props.filled }));
</script>

<template>
    <div v-bind="part('root', state)">
        <slot />
    </div>
</template>
