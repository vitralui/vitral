<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Select',
    category: 'Form',
    description: 'Choose one option from a list, with an optional filter that ignores case and accents.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Basic from './Select/Basic.vue';
import Groups from './Select/Groups.vue';
import SizesAndStates from './Select/SizesAndStates.vue';
import WithFilter from './Select/WithFilter.vue';
</script>

<template>
    <DemoSection title="Basic"><Basic /></DemoSection>
    <DemoSection title="Filter"><WithFilter /></DemoSection>
    <DemoSection title="Groups"><Groups /></DemoSection>
    <DemoSection title="Sizes and states"><SizesAndStates /></DemoSection>
</template>
