<script setup lang="ts">
import { WrapPanel } from '@vitral/vue';

const tiles = ['Photos', 'Mail', 'Maps', 'Music', 'Video', 'News', 'Store', 'Weather', 'Clock', 'Notes'];
</script>

<template>
    <WrapPanel class="frame resizable" :item-width="120" :item-height="72" :spacing="8">
        <div v-for="(tile, i) in tiles" :key="tile" class="box tile" :class="`c${(i % 5) + 1}`">{{ tile }}</div>
    </WrapPanel>
</template>

<style scoped>
.frame {
    width: 100%;
    padding: 0.5rem;
    border: 1px dashed color-mix(in srgb, var(--vt-text-color) 30%, transparent);
    border-radius: var(--vt-border-radius-md);
}

.resizable {
    resize: horizontal;
    overflow: auto;
    min-width: 12rem;
}

.box {
    --c: var(--vt-chart-1);
    padding: 0.375rem 0.625rem;
    font-size: 0.8125rem;
    color: var(--vt-text-color);
    background: color-mix(in srgb, var(--c) 18%, transparent);
    border: 1px solid color-mix(in srgb, var(--c) 55%, transparent);
    border-radius: var(--vt-border-radius-sm);
}

.tile {
    display: flex;
    align-items: flex-end;
    font-weight: 600;
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
