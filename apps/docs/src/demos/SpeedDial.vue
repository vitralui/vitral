<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'SpeedDial',
    category: 'Button',
    description: 'A floating button that fans its actions out, in a line or around a circle.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import CircleAndSemiCircle from './SpeedDial/CircleAndSemiCircle.vue';
import Linear from './SpeedDial/Linear.vue';
import QuarterCircle from './SpeedDial/QuarterCircle.vue';
</script>

<template>
    <DemoSection title="Linear"><Linear /></DemoSection>
    <DemoSection title="Circle and semi-circle"><CircleAndSemiCircle /></DemoSection>
    <DemoSection title="Quarter circle"><QuarterCircle /></DemoSection>
</template>
