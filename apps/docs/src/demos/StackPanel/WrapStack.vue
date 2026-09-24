<script setup lang="ts">
import { StackPanel } from '@vitral/vue';

const tags = ['Vue', 'React', 'Angular', 'Svelte', 'Presets', 'Tokens', 'Pass-through', 'Unstyled', 'Flexbox', 'Accessibility', 'Layout', 'Panels'];
</script>

<template>
    <StackPanel class="frame" orientation="horizontal" wrap :spacing="6">
        <span v-for="(tag, i) in tags" :key="tag" class="box" :class="`c${(i % 5) + 1}`">{{ tag }}</span>
    </StackPanel>
</template>

<style scoped>
.frame {
    width: 100%;
    padding: 0.5rem;
    border: 1px dashed color-mix(in srgb, var(--vt-text-color) 30%, transparent);
    border-radius: var(--vt-border-radius-md);
}

.box {
    --c: var(--vt-chart-1);
    padding: 0.5rem 0.75rem;
    font-size: 0.8125rem;
    color: var(--vt-text-color);
    background: color-mix(in srgb, var(--c) 18%, transparent);
    border: 1px solid color-mix(in srgb, var(--c) 55%, transparent);
    border-radius: var(--vt-border-radius-sm);
}

.c1 {
    --c: var(--vt-chart-1);
}

.c2 {
    --c: var(--vt-chart-2);
}

.c3 {
    --c: var(--vt-chart-3);
}

.c4 {
    --c: var(--vt-chart-4);
}

.c5 {
    --c: var(--vt-chart-5);
}
</style>
