<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Drawer',
    category: 'Overlay',
    description: 'A panel that slides in from an edge of the viewport, or covers it, with the same modal behaviour as Dialog.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Positions from './Drawer/Positions.vue';
</script>

<template>
    <DemoSection title="Positions"><Positions /></DemoSection>
</template>
