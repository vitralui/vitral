<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'ToggleButton',
    category: 'Form',
    description: 'A button that stays pressed, with its own on and off labels and icons.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Basic from './ToggleButton/Basic.vue';
import IconsAndLabels from './ToggleButton/IconsAndLabels.vue';
import SizesAndStates from './ToggleButton/SizesAndStates.vue';
</script>

<template>
    <DemoSection title="Basic"><Basic /></DemoSection>
    <DemoSection title="Icons and labels"><IconsAndLabels /></DemoSection>
    <DemoSection title="Sizes and states"><SizesAndStates /></DemoSection>
</template>
