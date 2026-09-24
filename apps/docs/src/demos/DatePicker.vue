<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'DatePicker',
    category: 'Form',
    description: "A date field you can type into or pick from a calendar, read in the locale's format."
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Basic from './DatePicker/Basic.vue';
import Constraints from './DatePicker/Constraints.vue';
import Fluid from './DatePicker/Fluid.vue';
import FooterButtons from './DatePicker/FooterButtons.vue';
import Inline from './DatePicker/Inline.vue';
import SizesVariantsAndStates from './DatePicker/SizesVariantsAndStates.vue';
</script>

<template>
    <DemoSection title="Basic"><Basic /></DemoSection>
    <DemoSection title="Constraints" description="Only the next 30 days, no weekends, and two blocked days. Unselectable days are skipped by the keys and cannot be clicked or typed."><Constraints /></DemoSection>
    <DemoSection title="Footer buttons"><FooterButtons /></DemoSection>
    <DemoSection title="Inline" description="The calendar on its own, without the field."><Inline /></DemoSection>
    <DemoSection title="Sizes, variants and states"><SizesVariantsAndStates /></DemoSection>
    <DemoSection title="Fluid" class="stack"><Fluid /></DemoSection>
</template>
