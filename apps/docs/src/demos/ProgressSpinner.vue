<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'ProgressSpinner',
    category: 'Messages',
    description: 'A ring that turns while something is running. Indeterminate by default and named “Loading…” from the locale; give it a `value` and it fills clockwise.'
};
</script>

<script setup lang="ts">
import { ProgressSpinner } from '@vitral/vue';
import DemoSection from '../DemoSection.vue';
</script>

<template>
    <DemoSection title="Indeterminate" description="Three sizes and stroke widths.">
        <ProgressSpinner size="1rem" :stroke-width="4" />
        <ProgressSpinner />
        <ProgressSpinner size="3rem" :stroke-width="2.5" />
        <ProgressSpinner size="4rem" :stroke-width="2" animation-duration="3s" aria-label="Loading slowly" />
    </DemoSection>
    <DemoSection title="Determinate" description="A value from 0 to 100 draws the ring’s share of a full turn over a faint track.">
        <ProgressSpinner :value="25" aria-label="25% done" />
        <ProgressSpinner :value="50" aria-label="Half done" />
        <ProgressSpinner :value="80" size="3rem" aria-label="80% done" />
    </DemoSection>
    <DemoSection title="Colour" description="Per-instance tokens with `dt`.">
        <ProgressSpinner :dt="{ progressspinner: { color: '{success.color}' } }" />
        <ProgressSpinner :dt="{ progressspinner: { color: '{danger.color}' } }" />
        <ProgressSpinner :dt="{ progressspinner: { color: '{warn.color}' } }" />
    </DemoSection>
</template>
