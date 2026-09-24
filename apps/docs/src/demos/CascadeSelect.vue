<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'CascadeSelect',
    category: 'Form',
    description: 'A select for nested options, one column per level, opening each group beside the last.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Basic from './CascadeSelect/Basic.vue';
import SizesAndStates from './CascadeSelect/SizesAndStates.vue';
import UnevenDepth from './CascadeSelect/UnevenDepth.vue';
</script>

<template>
    <DemoSection title="Basic"><Basic /></DemoSection>
    <DemoSection title="Uneven depth"><UnevenDepth /></DemoSection>
    <DemoSection title="Sizes and states"><SizesAndStates /></DemoSection>
</template>
