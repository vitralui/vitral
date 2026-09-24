<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'ProgressBar',
    category: 'Messages',
    description: 'How far along a task is, as a thin bar, with a value or indeterminate.'
};
</script>

<script setup lang="ts">
import DemoSection from '../DemoSection.vue';
import Determinate from './ProgressBar/Determinate.vue';
import Indeterminate from './ProgressBar/Indeterminate.vue';
import ValueLabel from './ProgressBar/ValueLabel.vue';
</script>

<template>
    <DemoSection title="Determinate"><Determinate /></DemoSection>
    <DemoSection title="Label" description="`unit` follows the value and becomes its spoken text; `show-value` off hides it; the slot replaces it."><ValueLabel /></DemoSection>
    <DemoSection title="Indeterminate" description="Work of unknown length; no value is announced."><Indeterminate /></DemoSection>
</template>
