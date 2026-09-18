<script setup lang="ts">
import { stepperStyle } from '@vitral/styles';
import { inject, provide } from 'vue';
import { useComponent } from '../../base/useComponent';
import { inheritUnstyled, StepItemKey, StepperKey } from './context';
import type { StepItemProps, StepperSlots } from './types';

defineOptions({ name: 'VtStepItem' });

const props = withDefaults(defineProps<StepItemProps>(), { unstyled: undefined });
defineSlots<StepperSlots>();

const { part } = useComponent(stepperStyle, inheritUnstyled(props, inject(StepperKey, null)));
provide(StepItemKey, { value: () => props.value });
</script>

<template>
    <div v-bind="part('item')">
        <slot />
    </div>
</template>
