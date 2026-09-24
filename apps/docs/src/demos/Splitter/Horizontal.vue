<script setup lang="ts">
import { Splitter, SplitterPanel, type SplitterResizeEvent } from '@vitral/vue';
import { ref } from 'vue';

const sizes = ref([25, 50, 25]);
const ended = ref<number[] | null>(null);
const show = (value: number | undefined) => `${Math.round(value ?? 0)}%`;
const onResize = (event: SplitterResizeEvent) => (sizes.value = event.sizes);
</script>

<template>
    <Splitter class="demo-splitter" @resize="onResize" @resizeend="ended = $event.sizes">
        <SplitterPanel :size="25" :min-size="10"><div class="cell c1">{{ show(sizes[0]) }}</div></SplitterPanel>
        <SplitterPanel :size="50" :min-size="10"><div class="cell c2">{{ show(sizes[1]) }}</div></SplitterPanel>
        <SplitterPanel :size="25" :min-size="10"><div class="cell c3">{{ show(sizes[2]) }}</div></SplitterPanel>
    </Splitter>
    <small style="color: var(--vt-text-muted-color)">resizeend: {{ ended ? ended.map((s) => show(s)).join(' · ') : '—' }}</small>
</template>

<style scoped>
.demo-splitter {
    width: 100%;
    height: 12rem;
}

.cell {
    --c: var(--vt-chart-1);
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--vt-text-color);
    background: color-mix(in srgb, var(--c) 14%, transparent);
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
