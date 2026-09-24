<script setup lang="ts">
import { DockPanel } from '@vitral/vue';
</script>

<template>
    <DockPanel class="frame" :spacing="8">
        <template #left><div class="box c2 side">left</div></template>
        <div class="box c3 fill">fill</div>
    </DockPanel>
</template>

<style scoped>
.frame {
    width: 100%;
    height: 8rem;
    padding: 0.5rem;
    border: 1px dashed color-mix(in srgb, var(--vt-text-color) 30%, transparent);
    border-radius: var(--vt-border-radius-md);
    overflow: hidden;
}

.box {
    --c: var(--vt-chart-1);
    box-sizing: border-box;
    height: 100%;
    padding: 0.5rem 0.75rem;
    font-size: 0.8125rem;
    color: var(--vt-text-color);
    background: color-mix(in srgb, var(--c) 18%, transparent);
    border: 1px solid color-mix(in srgb, var(--c) 55%, transparent);
}

.side {
    width: 10rem;
}

.fill {
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
}

.c2 {
    --c: var(--vt-chart-2);
}
.c3 {
    --c: var(--vt-chart-3);
}
</style>
