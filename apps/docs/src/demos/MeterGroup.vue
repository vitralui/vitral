<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'MeterGroup',
    category: 'Messages',
    description: 'Several values on one bar, with a legend, read out as a single total.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Basic from './MeterGroup/Basic.vue';
import LabelFirst from './MeterGroup/LabelFirst.vue';
import Vertical from './MeterGroup/Vertical.vue';
</script>

<template>
    <DemoSection title="Basic" class="stack"><Basic /></DemoSection>
    <DemoSection title="Label first, custom colours"><LabelFirst /></DemoSection>
    <DemoSection title="Vertical"><Vertical /></DemoSection>
</template>
