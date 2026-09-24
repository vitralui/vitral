<script setup lang="ts">
import { SelectButton } from '@vitral/vue';
import { ref } from 'vue';

const formats = ref<string[]>(['bold']);
const formatOptions = [
    { label: 'Bold', value: 'bold' },
    { label: 'Italic', value: 'italic' },
    { label: 'Underline', value: 'underline' }
];
</script>

<template>
    <div style="display: grid; gap: 0.5rem; justify-items: start">
        <SelectButton v-model="formats" :options="formatOptions" option-label="label" option-value="value" multiple label="Text format" />
        <small style="color: var(--vt-text-muted-color)">value: {{ JSON.stringify(formats) }}</small>
    </div>
</template>
