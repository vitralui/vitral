<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'Checkbox',
    category: 'Form',
    description: 'A native checkbox under a drawn box, bound to a boolean or to an array of values, with a mixed state.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Binary from './Checkbox/Binary.vue';
import GroupAndMixed from './Checkbox/GroupAndMixed.vue';
import RichContent from './Checkbox/RichContent.vue';
import SizesAndStates from './Checkbox/SizesAndStates.vue';
</script>

<template>
    <DemoSection title="Binary"><Binary /></DemoSection>
    <DemoSection title="Group and mixed state" description="The parent box is indeterminate while only some toppings are chosen."><GroupAndMixed /></DemoSection>
    <DemoSection title="Rich content"><RichContent /></DemoSection>
    <DemoSection title="Sizes and states"><SizesAndStates /></DemoSection>
</template>
