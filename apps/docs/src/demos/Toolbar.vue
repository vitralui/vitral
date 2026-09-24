<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Toolbar',
    category: 'Panel',
    description: 'A row of controls in start, center and end groups, with optional arrow-key navigation between them.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import RovingFocus from './Toolbar/RovingFocus.vue';
import StartCenterAndEnd from './Toolbar/StartCenterAndEnd.vue';
</script>

<template>
    <DemoSection title="Start, center and end" class="stack"><StartCenterAndEnd /></DemoSection>
    <DemoSection title="Roving focus" description="Tab reaches the bar once; the arrow keys move between its buttons. The disabled one is skipped." class="stack"><RovingFocus /></DemoSection>
</template>
