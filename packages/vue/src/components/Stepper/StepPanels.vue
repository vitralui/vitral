<script setup lang="ts">
import { stepperStyle } from '@vitral/styles';
import { inject } from 'vue';
import { useComponent } from '../../base/useComponent';
import { inheritUnstyled, StepperKey } from './context';
import type { StepPanelsProps, StepperSlots } from './types';

defineOptions({ name: 'VtStepPanels' });

const props = withDefaults(defineProps<StepPanelsProps>(), { unstyled: undefined });
defineSlots<StepperSlots>();

const { part } = useComponent(stepperStyle, inheritUnstyled(props, inject(StepperKey, null)));
</script>

<template>
    <div v-bind="part('panels')">
        <slot />
    </div>
</template>
