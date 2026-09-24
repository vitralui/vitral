<script setup lang="ts">
import { UniformGrid } from '@vitral/vue';
</script>

<template>
    <UniformGrid class="frame" :columns="4">
        <div v-for="n in 10" :key="n" class="box" :class="[`c${((n - 1) % 5) + 1}`, { tall: n === 6 }]">{{ n === 6 ? 'A taller cell sets every row' : n }}</div>
    </UniformGrid>
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

.tall {
    min-height: 4.5rem;
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
