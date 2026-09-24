<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'VirtualScroller',
    category: 'Data',
    description: 'Renders only the items near the viewport, so a hundred thousand rows cost what a screenful does, with lazy loading.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import HorizontalScroller from './VirtualScroller/HorizontalScroller.vue';
import HundredThousandRows from './VirtualScroller/HundredThousandRows.vue';
import LazyScroller from './VirtualScroller/LazyScroller.vue';
</script>

<template>
    <DemoSection title="A hundred thousand rows" class="stack"><HundredThousandRows /></DemoSection>
    <DemoSection title="Horizontal"><HorizontalScroller /></DemoSection>
    <DemoSection title="Lazy"><LazyScroller /></DemoSection>
</template>
