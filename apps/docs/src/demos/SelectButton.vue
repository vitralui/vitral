<script lang="ts">
import type { DemoMeta } from '../demo';

export const meta: DemoMeta = {
    title: 'SelectButton',
    category: 'Form',
    description:
        'A segmented control. With one choice it is a radio group — arrows move and select, one tab stop; with `multiple` it is a row of toggle buttons. Name the group with `label`.'
};
</script>

<script setup lang="ts">
import { SelectButton } from '@vitral/vue';
import { ref } from 'vue';
import DemoSection from '../DemoSection.vue';

const view = ref('Week');
const align = ref('left');
const alignments = [
    { label: 'Left', value: 'left', icon: 'menu' },
    { label: 'Center', value: 'center', icon: 'sliders' },
    { label: 'Right', value: 'right', icon: 'sidebar' }
];
const formats = ref<string[]>(['bold']);
const formatOptions = [
    { label: 'Bold', value: 'bold' },
    { label: 'Italic', value: 'italic' },
    { label: 'Underline', value: 'underline' }
];
const plan = ref('pro');
const plans = [
    { name: 'Free', code: 'free' },
    { name: 'Pro', code: 'pro' },
    { name: 'Enterprise', code: 'ent', off: true }
];
</script>

<template>
    <DemoSection title="Single" :description="`value: ${view}`">
        <SelectButton v-model="view" :options="['Day', 'Week', 'Month']" label="Calendar view" :allow-empty="false" />
    </DemoSection>
    <DemoSection title="Icons" :description="`value: ${align}`">
        <SelectButton v-model="align" :options="alignments" option-label="label" option-value="value" option-icon="icon" label="Alignment" />
    </DemoSection>
    <DemoSection title="Multiple" :description="`value: ${JSON.stringify(formats)}`">
        <SelectButton v-model="formats" :options="formatOptions" option-label="label" option-value="value" multiple label="Text format" />
    </DemoSection>
    <DemoSection title="Sizes and states">
        <SelectButton v-model="plan" :options="plans" option-label="name" option-value="code" option-disabled="off" size="small" label="Plan (small)" />
        <SelectButton v-model="plan" :options="plans" option-label="name" option-value="code" option-disabled="off" size="large" label="Plan (large)" />
        <SelectButton :model-value="'pro'" :options="plans" option-label="name" option-value="code" disabled label="Plan (disabled)" />
    </DemoSection>
</template>
