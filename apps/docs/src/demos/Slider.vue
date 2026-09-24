<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Slider',
    category: 'Form',
    description: 'Pick a value, or a range, by dragging along a track or with the keyboard.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Basic from './Slider/Basic.vue';
import Disabled from './Slider/Disabled.vue';
import Range from './Slider/Range.vue';
import Vertical from './Slider/Vertical.vue';
</script>

<template>
    <DemoSection title="Basic"><Basic /></DemoSection>
    <DemoSection title="Range" description="v-model is [start, end]. One name covers both thumbs, which are told apart as minimum and maximum."><Range /></DemoSection>
    <DemoSection title="Vertical" description="The minimum is at the bottom; Up and Right both increase."><Vertical /></DemoSection>
    <DemoSection title="Disabled"><Disabled /></DemoSection>
</template>
