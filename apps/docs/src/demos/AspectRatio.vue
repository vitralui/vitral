<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'AspectRatio',
    category: 'Media',
    description: 'A box that keeps its ratio as its width changes, with the content cropped to fill it.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Ratios from './AspectRatio/Ratios.vue';
</script>

<template>
    <DemoSection title="Ratios"><Ratios /></DemoSection>
</template>
