<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'TreeSelect',
    category: 'Form',
    description: 'A select over a tree, with the same filter and checkbox selection as Tree.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Basic from './TreeSelect/Basic.vue';
import CheckboxesAndChips from './TreeSelect/CheckboxesAndChips.vue';
import FilterAndMultiple from './TreeSelect/FilterAndMultiple.vue';
import SizesAndStates from './TreeSelect/SizesAndStates.vue';
</script>

<template>
    <DemoSection title="Basic"><Basic /></DemoSection>
    <DemoSection title="Checkboxes and chips"><CheckboxesAndChips /></DemoSection>
    <DemoSection title="Filter and multiple"><FilterAndMultiple /></DemoSection>
    <DemoSection title="Sizes and states"><SizesAndStates /></DemoSection>
</template>
