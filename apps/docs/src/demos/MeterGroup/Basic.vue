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
    <MeterGroup :value="storage" aria-label="Storage used" />
</template>
