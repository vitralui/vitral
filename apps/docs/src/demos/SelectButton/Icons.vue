<script setup lang="ts">
import { SelectButton } from '@vitral/vue';
import { ref } from 'vue';

const align = ref('left');
const alignments = [
    { label: 'Left', value: 'left', icon: 'menu' },
    { label: 'Center', value: 'center', icon: 'sliders' },
    { label: 'Right', value: 'right', icon: 'sidebar' }
];
</script>

<template>
    <div style="display: grid; gap: 0.5rem; justify-items: start">
        <SelectButton v-model="align" :options="alignments" option-label="label" option-value="value" option-icon="icon" label="Alignment" />
        <small style="color: var(--vt-text-muted-color)">value: {{ align }}</small>
    </div>
</template>
