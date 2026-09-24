<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Tabs',
    category: 'Panel',
    description: 'Views that share one place on the page, switched by a list of tabs.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Basic from './Tabs/Basic.vue';
import ManualActivation from './Tabs/ManualActivation.vue';
import VerticalTabs from './Tabs/VerticalTabs.vue';
</script>

<template>
    <DemoSection title="Basic"><Basic /></DemoSection>
    <DemoSection title="Vertical"><VerticalTabs /></DemoSection>
    <DemoSection title="Manual activation" description="With `select-on-focus` off, the arrows only move focus; Enter or Space selects."><ManualActivation /></DemoSection>
</template>
