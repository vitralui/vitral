<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'SplitButton',
    category: 'Button',
    description: 'A command with a menu of related commands welded to it.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Basic from './SplitButton/Basic.vue';
import SeveritiesAndVariants from './SplitButton/SeveritiesAndVariants.vue';
import SizesAndStates from './SplitButton/SizesAndStates.vue';
</script>

<template>
    <DemoSection title="Basic"><Basic /></DemoSection>
    <DemoSection title="Severities and variants"><SeveritiesAndVariants /></DemoSection>
    <DemoSection title="Sizes and states"><SizesAndStates /></DemoSection>
</template>
