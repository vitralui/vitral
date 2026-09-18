<script setup lang="ts">
import { stepperStyle } from '@vitral/styles';
import { computed, inject } from 'vue';
import { useComponent } from '../../base/useComponent';
import { inheritUnstyled, StepItemKey, StepperKey } from './context';
import type { StepPanelProps, StepPanelSlots, StepValue } from './types';

defineOptions({ name: 'VtStepPanel' });

const props = withDefaults(defineProps<StepPanelProps>(), { unstyled: undefined });
defineSlots<StepPanelSlots>();

const stepper = inject(StepperKey, null);
const item = inject(StepItemKey, null);
const { part } = useComponent(stepperStyle, inheritUnstyled(props, stepper));

const value = computed(() => props.value ?? item?.value());
const active = computed(() => stepper?.active.value === value.value);
const activate = (to: StepValue) => stepper?.select(to);
</script>

<template>
    <div
        v-if="active"
        :id="stepper?.panelId(value)"
        :role="item ? 'region' : 'tabpanel'"
        :aria-labelledby="stepper?.stepId(value)"
        :tabindex="item ? undefined : 0"
        v-bind="part('panel')"
    >
        <slot :value="value!" :active="active" :activate-callback="activate" />
    </div>
</template>
