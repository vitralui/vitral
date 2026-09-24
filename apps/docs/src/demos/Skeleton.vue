<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Skeleton',
    category: 'Messages',
    description: 'The outline of content that is still loading, in any shape, from a line of text to a whole card.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import CardLoading from './Skeleton/CardLoading.vue';
import Shapes from './Skeleton/Shapes.vue';
</script>

<template>
    <DemoSection title="Shapes"><Shapes /></DemoSection>
    <DemoSection title="A card loading"><CardLoading /></DemoSection>
</template>
