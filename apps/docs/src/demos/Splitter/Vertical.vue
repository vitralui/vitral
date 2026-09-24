<script setup lang="ts">
import { Splitter, SplitterPanel } from '@vitral/vue';
</script>

<template>
    <Splitter class="demo-splitter" layout="vertical" :gutter-size="6">
        <SplitterPanel :size="40"><div class="cell c4">top</div></SplitterPanel>
        <SplitterPanel :min-size="20"><div class="cell c5">bottom (min-size 20)</div></SplitterPanel>
    </Splitter>
</template>

<style scoped>
.demo-splitter {
    width: 100%;
    height: 18rem;
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

.c4 {
    --c: var(--vt-chart-4);
}
.c5 {
    --c: var(--vt-chart-5);
}
</style>
