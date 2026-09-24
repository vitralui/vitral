<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'RadioButton',
    category: 'Form',
    description: 'Native radios under drawn rings, grouped by RadioGroup with one name and one v-model.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import BasicGroup from './RadioButton/BasicGroup.vue';
import InvalidAndSizes from './RadioButton/InvalidAndSizes.vue';
import ObjectValues from './RadioButton/ObjectValues.vue';
import WithoutGroup from './RadioButton/WithoutGroup.vue';
</script>

<template>
    <DemoSection title="Radio group" description="Tab into the group, then use the arrow keys."><BasicGroup /></DemoSection>
    <DemoSection title="Horizontal, with object values"><ObjectValues /></DemoSection>
    <DemoSection title="Invalid and sizes"><InvalidAndSizes /></DemoSection>
    <DemoSection title="Without a group" description="Standalone radios share a group by their `name`."><WithoutGroup /></DemoSection>
</template>
