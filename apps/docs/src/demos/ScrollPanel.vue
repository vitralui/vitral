<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'ScrollPanel',
    category: 'Panel',
    description: "A scroll container with the theme's own thin bars, over native scrolling."
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import VerticalAndHorizontal from './ScrollPanel/VerticalAndHorizontal.vue';
</script>

<template>
    <DemoSection title="Vertical and horizontal"><VerticalAndHorizontal /></DemoSection>
</template>
