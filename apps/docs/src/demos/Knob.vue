<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Knob',
    category: 'Form',
    description: 'A dial for a bounded number, set by dragging, pressing anywhere on it or the keyboard.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Basic from './Knob/Basic.vue';
import RangeStepSize from './Knob/RangeStepSize.vue';
import ReadOnlyAndDisabled from './Knob/ReadOnlyAndDisabled.vue';
</script>

<template>
    <DemoSection title="Basic"><Basic /></DemoSection>
    <DemoSection title="Range, step and size"><RangeStepSize /></DemoSection>
    <DemoSection title="Read-only and disabled"><ReadOnlyAndDisabled /></DemoSection>
</template>
