<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'ScrollTop',
    category: 'Misc',
    description: 'A button back to the top of a long page or a scrolling element, shown past a threshold.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import InAnElement from './ScrollTop/InAnElement.vue';
</script>

<template>
    <DemoSection title="In an element"><InAnElement /></DemoSection>
</template>
