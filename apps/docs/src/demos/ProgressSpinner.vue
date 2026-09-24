<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'ProgressSpinner',
    category: 'Messages',
    description: 'A ring that turns while something is running, or fills clockwise to a value.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Determinate from './ProgressSpinner/Determinate.vue';
import Indeterminate from './ProgressSpinner/Indeterminate.vue';
import SpinnerColour from './ProgressSpinner/SpinnerColour.vue';
</script>

<template>
    <DemoSection title="Indeterminate" description="Three sizes and stroke widths."><Indeterminate /></DemoSection>
    <DemoSection title="Determinate" description="A value from 0 to 100 draws the ring’s share of a full turn over a faint track."><Determinate /></DemoSection>
    <DemoSection title="Colour" description="Per-instance tokens with `dt`."><SpinnerColour /></DemoSection>
</template>
