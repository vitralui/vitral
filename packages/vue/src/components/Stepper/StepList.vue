<script setup lang="ts">
import { stepperStyle } from '@vitral/styles';
import { inject } from 'vue';
import { useComponent } from '../../base/useComponent';
import { inheritUnstyled, StepperKey } from './context';
import type { StepListProps, StepperSlots } from './types';

defineOptions({ name: 'VtStepList' });

const props = withDefaults(defineProps<StepListProps>(), { unstyled: undefined });
defineSlots<StepperSlots>();

const { part } = useComponent(stepperStyle, inheritUnstyled(props, inject(StepperKey, null)));
</script>

<template>
    <div role="tablist" v-bind="part('list')">
        <slot />
    </div>
</template>
