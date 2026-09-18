<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'ToggleButton',
    category: 'Form',
    description:
        'A button that stays pressed: `aria-pressed` carries the state, so its name should not change with it — give it `aria-label` when the on and off labels differ.'
};
</script>

<script setup lang="ts">
import { ToggleButton } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const bold = ref(false);
const starred = ref(true);
const locked = ref(false);
</script>

<template>
    <DemoSection title="Basic" :description="`pressed: ${bold}`">
        <ToggleButton v-model="bold" on-label="Bold" off-label="Bold" />
    </DemoSection>
    <DemoSection title="Icons and labels">
        <ToggleButton v-model="starred" on-label="Starred" off-label="Star" on-icon="star" off-icon="star" aria-label="Star" />
        <ToggleButton v-model="locked" on-label="On" off-label="Off" on-icon="check" off-icon="x" aria-label="Lock editing" />
    </DemoSection>
    <DemoSection title="Sizes and states">
        <ToggleButton :model-value="true" on-label="Small" off-label="Small" size="small" />
        <ToggleButton :model-value="false" on-label="Large" off-label="Large" size="large" />
        <ToggleButton :model-value="false" on-label="Invalid" off-label="Invalid" invalid />
        <ToggleButton :model-value="true" on-label="Disabled" off-label="Disabled" disabled />
    </DemoSection>
</template>
