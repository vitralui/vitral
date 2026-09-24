<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Carousel',
    category: 'Media',
    description: 'A track of items with paging and optional rotation, which pauses on demand and while you point at or work in it.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Circular from './Carousel/Circular.vue';
import SeveralAtOnce from './Carousel/SeveralAtOnce.vue';
import Transitions from './Carousel/Transitions.vue';
import Vertical from './Carousel/Vertical.vue';
</script>

<template>
    <DemoSection title="Several at once" class="stack"><SeveralAtOnce /></DemoSection>
    <DemoSection title="Circular, with rotation" class="stack"><Circular /></DemoSection>
    <DemoSection title="Vertical"><Vertical /></DemoSection>
    <DemoSection title="Transitions, one at a time" description="The default slides the whole strip, which is what lets a carousel show several at once. Every other preset shows one and animates it where it stands, so it applies only where numVisible is 1. They are the same presets Galleria uses."><Transitions /></DemoSection>
</template>
