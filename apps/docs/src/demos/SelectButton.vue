<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'SelectButton',
    category: 'Form',
    description: 'A segmented control for one choice, as a radio group, or several, as toggle buttons.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Icons from './SelectButton/Icons.vue';
import Multiple from './SelectButton/Multiple.vue';
import Single from './SelectButton/Single.vue';
import SizesAndStates from './SelectButton/SizesAndStates.vue';
</script>

<template>
    <DemoSection title="Single"><Single /></DemoSection>
    <DemoSection title="Icons"><Icons /></DemoSection>
    <DemoSection title="Multiple"><Multiple /></DemoSection>
    <DemoSection title="Sizes and states"><SizesAndStates /></DemoSection>
</template>
