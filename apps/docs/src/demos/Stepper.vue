<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Stepper',
    category: 'Panel',
    description: 'Steps and their panels, horizontal or vertical, with an optional linear mode that keeps later steps out of reach.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Linear from './Stepper/Linear.vue';
import VerticalStepper from './Stepper/VerticalStepper.vue';
</script>

<template>
    <DemoSection title="Linear" class="stack"><Linear /></DemoSection>
    <DemoSection title="Vertical" class="stack"><VerticalStepper /></DemoSection>
</template>
