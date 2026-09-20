<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'MeterGroup',
    category: 'Messages',
    description: 'Several values on one bar, with a legend. It is a single WAI-ARIA meter whose value is the total and whose value text lists every part.'
};
</script>

<script setup lang="ts">
import { MeterGroup } from '@vitral/vue';
import DemoSection from '../DemoSection.vue';

const storage = [
    { label: 'Apps', value: 14, icon: 'grip' },
    { label: 'Messages', value: 12, icon: 'bell' },
    { label: 'Media', value: 24, icon: 'image' },
    { label: 'System', value: 10, icon: 'sliders' }
];
</script>

<template>
    <DemoSection title="Basic" class="stack">
        <MeterGroup :value="storage" aria-label="Storage used" />
    </DemoSection>
    <DemoSection title="Label first, custom colours">
        <MeterGroup
            :value="[
                { label: 'Done', value: 45, color: 'var(--vt-success-color)' },
                { label: 'In review', value: 20, color: 'var(--vt-warn-color)' },
                { label: 'Blocked', value: 5, color: 'var(--vt-danger-color)' }
            ]"
            label-position="start"
            aria-label="Sprint progress"
            style="width: 100%"
        />
    </DemoSection>
    <DemoSection title="Vertical">
        <MeterGroup :value="storage" orientation="vertical" aria-label="Storage used, vertical" style="height: 12rem" />
    </DemoSection>
</template>
