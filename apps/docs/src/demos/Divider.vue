<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Divider',
    category: 'Panel',
    description: 'A horizontal or vertical line between pieces of content, solid, dashed or dotted, with optional content set into it.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Content from './Divider/Content.vue';
import Types from './Divider/Types.vue';
import Vertical from './Divider/Vertical.vue';
</script>

<template>
    <DemoSection title="Types" class="stack"><Types /></DemoSection>
    <DemoSection title="Content" class="stack"><Content /></DemoSection>
    <DemoSection title="Vertical"><Vertical /></DemoSection>
</template>
