<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Accordion',
    category: 'Panel',
    description: 'Stacked sections that open and close, one at a time or several at once, with headers that follow the WAI-ARIA accordion.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import CustomIcons from './Accordion/CustomIcons.vue';
import Multiple from './Accordion/Multiple.vue';
import OneOpenAtATime from './Accordion/OneOpenAtATime.vue';
</script>

<template>
    <DemoSection title="One open at a time" class="stack"><OneOpenAtATime /></DemoSection>
    <DemoSection title="Multiple" class="stack"><Multiple /></DemoSection>
    <DemoSection title="Custom icons"><CustomIcons /></DemoSection>
</template>
