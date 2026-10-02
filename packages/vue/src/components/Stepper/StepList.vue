<script setup lang="ts">
import { stepperStyle } from '@vitral/styles';
import { inject, ref } from 'vue';
import { useComponent } from '../../base/useComponent';
import { useScrollbars } from '../../base/useScrollbars';
import { inheritUnstyled, StepperKey } from './context';
import type { StepListProps, StepperSlots } from './types';

defineOptions({ name: 'VtStepList' });

const props = withDefaults(defineProps<StepListProps>(), { unstyled: undefined });
defineSlots<StepperSlots>();

const { part } = useComponent(stepperStyle, inheritUnstyled(props, inject(StepperKey, null)));
const listRef = ref<HTMLElement | null>(null);
useScrollbars(listRef, props);
</script>

<template>
    <div ref="listRef" role="tablist" v-bind="part('list')">
        <slot />
    </div>
</template>
