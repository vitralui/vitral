<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Splitter',
    category: 'Layout',
    description: "Panels with a gutter between each pair that resizes them, by dragging or from the keyboard, within each panel's minimum."
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Horizontal from './Splitter/Horizontal.vue';
import Nested from './Splitter/Nested.vue';
import Vertical from './Splitter/Vertical.vue';
</script>

<template>
    <DemoSection title="Horizontal" description="Three panels, each with min-size 10. The panels show their own size, from the resize event."><Horizontal /></DemoSection>
    <DemoSection title="Vertical" description="layout=&quot;vertical&quot; stacks the panels; the arrow keys are Up and Down."><Vertical /></DemoSection>
    <DemoSection title="Nested" description="A splitter inside a panel fills it: an explorer beside an editor over a terminal."><Nested /></DemoSection>
</template>
