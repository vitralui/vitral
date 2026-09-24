<script setup lang="ts">
import { StackPanel } from '@vitral/vue';
</script>

<template>
    <StackPanel class="frame narrow">
        <div class="box c1">Header</div>
        <div class="box c2">Body</div>
        <div class="box c3">Footer</div>
    </StackPanel>
</template>

<style scoped>
.frame {
    width: 100%;
    padding: 0.5rem;
    border: 1px dashed color-mix(in srgb, var(--vt-text-color) 30%, transparent);
    border-radius: var(--vt-border-radius-md);
}

.narrow {
    max-width: 18rem;
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
</style>
