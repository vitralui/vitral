<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'HoverCard',
    category: 'Overlay',
    description: 'A preview of what a link points at, shown while the pointer rests on it or focus reaches it.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Basic from './HoverCard/Basic.vue';
import PlacementAndDelays from './HoverCard/PlacementAndDelays.vue';
</script>

<template>
    <DemoSection title="Basic"><Basic /></DemoSection>
    <DemoSection title="Placement and delays"><PlacementAndDelays /></DemoSection>
</template>
