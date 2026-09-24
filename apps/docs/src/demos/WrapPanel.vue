<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'WrapPanel',
    category: 'Layout',
    description: 'Lays children out in a line and wraps to the next when it is full, across or down, with an optional uniform size.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import HorizontalWrap from './WrapPanel/HorizontalWrap.vue';
import ItemWidthAndHeight from './WrapPanel/ItemWidthAndHeight.vue';
import VerticalWrap from './WrapPanel/VerticalWrap.vue';
</script>

<template>
    <DemoSection title="Horizontal" description="Each child keeps its own width. Drag the frame's corner to resize it and watch the lines re-flow."><HorizontalWrap /></DemoSection>
    <DemoSection title="ItemWidth and ItemHeight" description="item-width=&quot;120&quot; item-height=&quot;72&quot;: every child the same size, whatever its content."><ItemWidthAndHeight /></DemoSection>
    <DemoSection title="Vertical" description="Fills columns top to bottom; needs a height to wrap in."><VerticalWrap /></DemoSection>
</template>
