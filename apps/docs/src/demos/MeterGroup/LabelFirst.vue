<script setup lang="ts">
import { MeterGroup } from '@vitral/vue';

const sprint = [
    { label: 'Done', value: 45, color: 'var(--vt-success-color)' },
    { label: 'In review', value: 20, color: 'var(--vt-warn-color)' },
    { label: 'Blocked', value: 5, color: 'var(--vt-danger-color)' }
];
</script>

<template>
    <MeterGroup :value="sprint" label-position="start" aria-label="Sprint progress" style="width: 100%" />
</template>
