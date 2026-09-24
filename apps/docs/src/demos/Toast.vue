<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Toast',
    category: 'Messages',
    description: 'Notifications sent from anywhere with useToast, stacked at a chosen position, that pause their timer while hovered or focused.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Severities from './Toast/Severities.vue';
import StickyAndGrouped from './Toast/StickyAndGrouped.vue';
</script>

<template>
    <DemoSection title="Severities" description="Four seconds each; hover one to keep it."><Severities /></DemoSection>
    <DemoSection title="Sticky and grouped" description="Without a `life` a toast waits to be closed. A `group` sends it to another `<Toast>`, here one at the bottom."><StickyAndGrouped /></DemoSection>
</template>
