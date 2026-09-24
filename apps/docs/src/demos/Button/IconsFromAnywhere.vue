<script setup lang="ts">
import { graduationCap } from '@vitral/icons';
import { Button } from '@vitral/vue';
import { h } from 'vue';

// Stands in for another library's icon component (lucide-vue-next, @iconify/vue…).
const Sparkle = () =>
    h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, [
        h('path', { d: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6' })
    ]);
const markup = '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6"/></svg>';
</script>

<template>
    <Button label="Course" :icon="graduationCap" severity="secondary" />
    <Button label="Component" :icon="Sparkle" severity="secondary" />
    <Button label="Markup" :icon="markup" severity="secondary" />
</template>
