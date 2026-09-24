<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Timeline',
    category: 'Data',
    description: 'Events on an axis, down the page or across it, with content on one side, the other, or alternating.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import AlternateWithIcons from './Timeline/AlternateWithIcons.vue';
import HorizontalTimeline from './Timeline/HorizontalTimeline.vue';
import OppositeContent from './Timeline/OppositeContent.vue';
</script>

<template>
    <DemoSection title="Opposite content"><OppositeContent /></DemoSection>
    <DemoSection title="Alternate, with icons"><AlternateWithIcons /></DemoSection>
    <DemoSection title="Horizontal"><HorizontalTimeline /></DemoSection>
</template>
