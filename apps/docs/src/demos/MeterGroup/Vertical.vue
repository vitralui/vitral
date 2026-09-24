<script setup lang="ts">
import { MeterGroup } from '@vitral/vue';

const storage = [
    { label: 'Apps', value: 14, icon: 'grip' },
    { label: 'Messages', value: 12, icon: 'bell' },
    { label: 'Media', value: 24, icon: 'image' },
    { label: 'System', value: 10, icon: 'sliders' }
];
</script>

<template>
    <MeterGroup :value="storage" orientation="vertical" aria-label="Storage used, vertical" style="height: 12rem" />
</template>
