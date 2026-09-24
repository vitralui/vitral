<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Sidebar',
    category: 'Menu',
    description: 'The collapsible application sidebar: navigation with sub-lists, that shrinks to its icons and becomes a drawer on small screens.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import CollapsibleToIcons from './Sidebar/CollapsibleToIcons.vue';
import OffCanvas from './Sidebar/OffCanvas.vue';
</script>

<template>
    <DemoSection title="Collapsible to icons"><CollapsibleToIcons /></DemoSection>
    <DemoSection title="Off canvas"><OffCanvas /></DemoSection>
</template>
