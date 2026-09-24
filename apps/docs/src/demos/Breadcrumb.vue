<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Breadcrumb',
    category: 'Menu',
    description: 'Where the page sits in a hierarchy: a trail of links with the current page last and separators in between.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import CustomSeparator from './Breadcrumb/CustomSeparator.vue';
import WithHome from './Breadcrumb/WithHome.vue';
</script>

<template>
    <DemoSection title="With a home item"><WithHome /></DemoSection>
    <DemoSection title="Icons and a custom separator"><CustomSeparator /></DemoSection>
</template>
