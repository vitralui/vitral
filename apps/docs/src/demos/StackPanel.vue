<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'StackPanel',
    category: 'Layout',
    description: 'Arranges its children in one line, stacked or side by side, with even spacing between them.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import OrientationSpacingAndAlignment from './StackPanel/OrientationSpacingAndAlignment.vue';
import VerticalStack from './StackPanel/VerticalStack.vue';
import WrapStack from './StackPanel/WrapStack.vue';
</script>

<template>
    <DemoSection title="Vertical" description="The default. Children stack top to bottom and stretch to the panel's width; the gap is the stackpanel.spacing token."><VerticalStack /></DemoSection>
    <DemoSection title="Orientation, spacing and alignment" description="The dashed frame is the panel. Align moves children across the line; justify spreads them along it."><OrientationSpacingAndAlignment /></DemoSection>
    <DemoSection title="Wrap" description="A horizontal stack with wrap flows onto more lines instead of overflowing."><WrapStack /></DemoSection>
</template>
