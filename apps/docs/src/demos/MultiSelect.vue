<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'MultiSelect',
    category: 'Form',
    description: 'A select for several choices, shown as a list, a count or chips, with an optional filter.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Basic from './MultiSelect/Basic.vue';
import ChipsAndFilter from './MultiSelect/ChipsAndFilter.vue';
import GroupsAndLimit from './MultiSelect/GroupsAndLimit.vue';
import SizesAndStates from './MultiSelect/SizesAndStates.vue';
</script>

<template>
    <DemoSection title="Basic"><Basic /></DemoSection>
    <DemoSection title="Chips and filter"><ChipsAndFilter /></DemoSection>
    <DemoSection title="Groups and a selection limit"><GroupsAndLimit /></DemoSection>
    <DemoSection title="Sizes and states"><SizesAndStates /></DemoSection>
</template>
