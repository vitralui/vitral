<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Stat',
    category: 'Data',
    description: 'A figure worth a glance — what it is, how much, and which way it went — formatted for the locale, with the change read out in words.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Dashboard from './Stat/Dashboard.vue';
import Inverted from './Stat/Inverted.vue';
import WithChart from './Stat/WithChart.vue';
</script>

<template>
    <DemoSection title="A row of figures" description="`delta` is a ratio: `0.125` is +12.5%. The arrow and the colour are not read out, so the change is said in words."><Dashboard /></DemoSection>
    <DemoSection title="When down is good" description="`invert` for costs, errors and load times: a fall is shown in the good colour, still pointing down."><Inverted /></DemoSection>
    <DemoSection title="With a sparkline" description="The `chart` slot sits under the figure."><WithChart /></DemoSection>
</template>
