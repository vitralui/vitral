<script setup lang="ts">
import { Button, UniformGrid } from '@vitral/vue';
import { ref } from 'vue';

const count = ref(7);
</script>

<template>
    <div class="controls">
        <Button icon="minus" severity="secondary" aria-label="Remove a cell" :disabled="count <= 1" @click="count--" />
        <Button icon="plus" severity="secondary" aria-label="Add a cell" @click="count++" />
        <small style="color: var(--vt-text-muted-color)">{{ count }} children</small>
    </div>
    <UniformGrid class="frame square">
        <div v-for="n in count" :key="n" class="box" :class="`c${((n - 1) % 5) + 1}`">{{ n }}</div>
    </UniformGrid>
</template>

<style scoped>
.controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
}

.frame {
    width: 100%;
    padding: 0.5rem;
    border: 1px dashed color-mix(in srgb, var(--vt-text-color) 30%, transparent);
    border-radius: var(--vt-border-radius-md);
}

.square {
    max-width: 22rem;
}

.box {
    --c: var(--vt-chart-1);
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 2.5rem;
    padding: 0.375rem;
    font-size: 0.8125rem;
    text-align: center;
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
