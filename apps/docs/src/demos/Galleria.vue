<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Galleria',
    category: 'Media',
    description: 'Images with thumbnails, indicators, rotation and a full-screen mode.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import FullScreen from './Galleria/FullScreen.vue';
import IndicatorsAndRotation from './Galleria/IndicatorsAndRotation.vue';
import Thumbnails from './Galleria/Thumbnails.vue';
import Transitions from './Galleria/Transitions.vue';
</script>

<template>
    <DemoSection title="Thumbnails"><Thumbnails /></DemoSection>
    <DemoSection
        title="Transitions"
        description="How one picture gives way to the next, by name. The presets are defined once and shared with Carousel, and every one of them stops under prefers-reduced-motion."
    ><Transitions /></DemoSection>
    <DemoSection title="Indicators and rotation"><IndicatorsAndRotation /></DemoSection>
    <DemoSection title="Full screen"><FullScreen /></DemoSection>
</template>
