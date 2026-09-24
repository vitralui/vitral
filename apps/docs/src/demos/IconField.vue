<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'IconField',
    category: 'Form',
    description: 'An icon inside a field, at the start or the end, with the text padded past it.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import MeaningfulIcon from './IconField/MeaningfulIcon.vue';
import OtherFields from './IconField/OtherFields.vue';
import StartAndEnd from './IconField/StartAndEnd.vue';
</script>

<template>
    <DemoSection title="Start and end"><StartAndEnd /></DemoSection>
    <DemoSection title="Both, with a meaningful icon"><MeaningfulIcon /></DemoSection>
    <DemoSection title="Other fields"><OtherFields /></DemoSection>
</template>
